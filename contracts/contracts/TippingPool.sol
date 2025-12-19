// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TippingPool
 * @dev Handles tipping for Midnight Radio voice notes
 * 
 * Features:
 * - Tip any voice note by token ID
 * - 5% platform fee to treasury
 * - 95% goes to broadcaster
 * - Events for backend tracking
 */
contract TippingPool is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant PLATFORM_FEE_BPS = 500; // 5% in basis points
    uint256 public constant BPS_DENOMINATOR = 10000;

    // State
    address public treasury;
    address public voiceNoteNFT;

    // Track tips per tokenId
    mapping(uint256 => uint256) public totalTips;

    // Events
    event TipReceived(
        uint256 indexed tokenId,
        address indexed tipper,
        address indexed broadcaster,
        uint256 tipAmount,
        uint256 platformFee,
        uint256 broadcasterAmount
    );

    event TreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(address _treasury, address _voiceNoteNFT) Ownable(msg.sender) {
        treasury = _treasury;
        voiceNoteNFT = _voiceNoteNFT;
    }

    /**
     * @dev Tip a voice note
     * @param tokenId The NFT token ID to tip
     * @param broadcaster The broadcaster's wallet address
     */
    function tip(uint256 tokenId, address broadcaster) external payable nonReentrant {
        require(msg.value > 0, "Tip must be greater than 0");
        require(broadcaster != address(0), "Invalid broadcaster");

        uint256 tipAmount = msg.value;
        
        // Calculate fees
        uint256 platformFee = (tipAmount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 broadcasterAmount = tipAmount - platformFee;

        // Update total tips for this token
        totalTips[tokenId] += tipAmount;

        // Send to treasury
        if (platformFee > 0) {
            (bool treasurySent, ) = treasury.call{value: platformFee}("");
            require(treasurySent, "Failed to send platform fee");
        }

        // Send to broadcaster
        (bool broadcasterSent, ) = broadcaster.call{value: broadcasterAmount}("");
        require(broadcasterSent, "Failed to send to broadcaster");

        emit TipReceived(
            tokenId,
            msg.sender,
            broadcaster,
            tipAmount,
            platformFee,
            broadcasterAmount
        );
    }

    /**
     * @dev Get total tips for a token
     */
    function getTotalTips(uint256 tokenId) external view returns (uint256) {
        return totalTips[tokenId];
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @dev Update VoiceNoteNFT address
     */
    function setVoiceNoteNFT(address _voiceNoteNFT) external onlyOwner {
        voiceNoteNFT = _voiceNoteNFT;
    }

    /**
     * @dev Withdraw any stuck funds
     */
    function withdraw() external onlyOwner {
        (bool sent, ) = treasury.call{value: address(this).balance}("");
        require(sent, "Failed to withdraw");
    }
}
