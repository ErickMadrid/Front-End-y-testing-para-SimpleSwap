// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title SimpleSwap - Minimal AMM for a fixed token pair with LP tokens (gas optimized)
/// @notice Add/remove liquidity, swap tokens, get prices, calculate amounts out
contract SimpleSwap {
    address public immutable tokenA;
    address public immutable tokenB;

    uint112 private reserveA;
    uint112 private reserveB;

    uint private constant FEE_NUMERATOR = 997;
    uint private constant FEE_DENOMINATOR = 1000;

    string public name = "SimpleSwap LP Token";
    string public symbol = "SSLP";
    uint8 public decimals = 18;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;

    event LiquidityAdded(address indexed user, uint amountA, uint amountB, uint liquidity);
    event LiquidityRemoved(address indexed user, uint amountA, uint amountB, uint liquidity);
    event SwapExecuted(address indexed user, address tokenIn, address tokenOut, uint amountIn, uint amountOut);
    event Transfer(address indexed from, address indexed to, uint256 value);

    constructor(address _tokenA, address _tokenB) {
        require(_tokenA != _tokenB, "Identical token addresses");
        tokenA = _tokenA;
        tokenB = _tokenB;
    }

    // ----------- ERC20 LP token logic ------------

    function _mint(address to, uint256 amount) internal {
        totalSupply += amount;
        balanceOf[to] += amount;
        emit Transfer(address(0), to, amount);
    }

    function _burn(address from, uint256 amount) internal {
        balanceOf[from] -= amount;
        totalSupply -= amount;
        emit Transfer(from, address(0), amount);
    }

    // ----------- Safe transferFrom wrapper ------------

    function _safeTransferFrom(address token, address from, address to, uint amount) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transferFrom.selector, from, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "TransferFrom failed");
    }

    function _safeTransfer(address token, address to, uint amount) internal {
        (bool success, bytes memory data) =
            token.call(abi.encodeWithSelector(IERC20.transfer.selector, to, amount));
        require(success && (data.length == 0 || abi.decode(data, (bool))), "Transfer failed");
    }

    // ----------- Liquidity functions ------------

    function addLiquidity(
        address to,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity) {
        require(block.timestamp <= deadline, "Expired");

        uint112 _reserveA = reserveA;
        uint112 _reserveB = reserveB;

        if (_reserveA == 0 && _reserveB == 0) {
            amountA = amountADesired;
            amountB = amountBDesired;
        } else {
            uint amountBOptimal = (amountADesired * _reserveB) / _reserveA;
            if (amountBOptimal <= amountBDesired) {
                require(amountBOptimal >= amountBMin, "Slippage B");
                amountA = amountADesired;
                amountB = amountBOptimal;
            } else {
                uint amountAOptimal = (amountBDesired * _reserveA) / _reserveB;
                require(amountAOptimal >= amountAMin, "Slippage A");
                amountA = amountAOptimal;
                amountB = amountBDesired;
            }
        }

        _safeTransferFrom(tokenA, msg.sender, address(this), amountA);
        _safeTransferFrom(tokenB, msg.sender, address(this), amountB);

        if (totalSupply == 0) {
            liquidity = sqrt(amountA * amountB);
        } else {
            liquidity = min(
                (amountA * totalSupply) / _reserveA,
                (amountB * totalSupply) / _reserveB
            );
        }
        require(liquidity > 0, "Insufficient liquidity");

        reserveA = uint112(_reserveA + amountA);
        reserveB = uint112(_reserveB + amountB);

        _mint(to, liquidity);

        emit LiquidityAdded(msg.sender, amountA, amountB, liquidity);
    }

    function removeLiquidity(
        address to,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        uint deadline
    ) external returns (uint amountA, uint amountB) {
        require(block.timestamp <= deadline, "Expired");
        require(liquidity > 0 && liquidity <= balanceOf[msg.sender], "Invalid liquidity");

        uint _totalSupply = totalSupply;

        amountA = (liquidity * reserveA) / _totalSupply;
        amountB = (liquidity * reserveB) / _totalSupply;

        require(amountA >= amountAMin && amountB >= amountBMin, "Slippage");

        _burn(msg.sender, liquidity);

        reserveA -= uint112(amountA);
        reserveB -= uint112(amountB);

        _safeTransfer(tokenA, to, amountA);
        _safeTransfer(tokenB, to, amountB);

        emit LiquidityRemoved(msg.sender, amountA, amountB, liquidity);
    }

    // ----------- Swap function ------------

    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address tokenIn,
        address tokenOut,
        address to,
        uint deadline
    ) external returns (uint amountOut) {
        require(block.timestamp <= deadline, "Expired");
        require(
            (tokenIn == tokenA && tokenOut == tokenB) ||
            (tokenIn == tokenB && tokenOut == tokenA),
            "Invalid token pair"
        );
        require(amountIn > 0, "AmountIn zero");
        require(to != address(0), "Invalid recipient");

        bool zeroForOne = tokenIn == tokenA;
        (uint _reserveIn, uint _reserveOut) = zeroForOne ? (reserveA, reserveB) : (reserveB, reserveA);

        _safeTransferFrom(tokenIn, msg.sender, address(this), amountIn);

        amountOut = getAmountOut(amountIn, _reserveIn, _reserveOut);
        require(amountOut >= amountOutMin, "Insufficient output");

        _safeTransfer(tokenOut, to, amountOut);

        if (zeroForOne) {
            reserveA = uint112(_reserveIn + amountIn);
            reserveB = uint112(_reserveOut - amountOut);
        } else {
            reserveB = uint112(_reserveIn + amountIn);
            reserveA = uint112(_reserveOut - amountOut);
        }

        emit SwapExecuted(msg.sender, tokenIn, tokenOut, amountIn, amountOut);
    }

    // ----------- View functions ------------

    function getPrice(address base, address quote) external view returns (uint price) {
        require(
            (base == tokenA && quote == tokenB) ||
            (base == tokenB && quote == tokenA),
            "Invalid pair"
        );

        if (base == tokenA) {
            price = (uint(reserveB) * 1e18) / reserveA;
        } else {
            price = (uint(reserveA) * 1e18) / reserveB;
        }
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns (uint amountOut) {
        require(amountIn > 0 && reserveIn > 0 && reserveOut > 0, "Invalid inputs");
        uint amountInWithFee = amountIn * FEE_NUMERATOR;
        uint numerator = amountInWithFee * reserveOut;
        uint denominator = reserveIn * FEE_DENOMINATOR + amountInWithFee;
        amountOut = numerator / denominator;
    }

    // ----------- Helpers ------------

    function sqrt(uint y) internal pure returns (uint z) {
        if (y > 3) {
            z = y;
            uint x = y / 2 + 1;
            while (x < z) {
                z = x;
                x = (y / x + x) / 2;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function min(uint x, uint y) internal pure returns (uint) {
        return x < y ? x : y;
    }
}