// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title EchoRegistry
 * @dev Manages echo (reply) relationships between voice note NFTs
 * 
 * Features:
 * - Track parent-child relationships between voice notes
 * - Small echo fee (split between parent creator and platform)
 * - Echo count tracking for leaderboards
 */
contract EchoRegistry is Ownable, ReentrancyGuard {
    // Constants
    uint256 public constant ECHO_FEE = 0.001 ether; // 0.001 MNT
    uint256 public constant CREATOR_SHARE = 50; // 50% to parent creator
    uint256 public constant PLATFORM_SHARE = 50; // 50% to platform

    // State
    address public treasury;

    // Echo data structure
    struct Echo {
        string echoNoteId;      // UUID of the echo note
        string parentNoteId;    // UUID of the parent note
        address echoBroadcaster; // Address of echo creator
        address parentBroadcaster; // Address of parent creator
        uint256 timestamp;
    }

    // Mappings
    mapping(string => Echo[]) public echoesByParent; // parentNoteId => echoes
    mapping(string => uint256) public echoCount; // parentNoteId => count
    mapping(string => bool) public isEcho; // echoNoteId => is it an echo
    mapping(string => string) public echoParent; // echoNoteId => parentNoteId

    // Events
    event EchoRegistered(
        string indexed parentNoteId,
        string indexed echoNoteId,
        address echoBroadcaster,
        address parentBroadcaster,
        uint256 timestamp,
        uint256 creatorPayment,
        uint256 platformPayment
    );

    event TreasuryUpdated(address oldTreasury, address newTreasury);

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    /**
     * @dev Register an echo for a parent voice note
     * @param parentNoteId Parent voice note ID (UUID)
     * @param echoNoteId Echo voice note ID (UUID)
     * @param parentBroadcaster Address of parent note creator (to receive share)
     */
    function registerEcho(
        string calldata parentNoteId,
        string calldata echoNoteId,
        address parentBroadcaster
    ) external payable nonReentrant {
        require(bytes(parentNoteId).length > 0, "Invalid parent ID");
        require(bytes(echoNoteId).length > 0, "Invalid echo ID");
        require(!isEcho[echoNoteId], "Already registered as echo");
        require(
            keccak256(bytes(echoNoteId)) != keccak256(bytes(parentNoteId)), 
            "Cannot echo itself"
        );
        require(parentBroadcaster != address(0), "Invalid parent broadcaster");
        require(msg.value >= ECHO_FEE, "Insufficient echo fee");

        // Calculate payment split
        uint256 creatorPayment = (msg.value * CREATOR_SHARE) / 100;
        uint256 platformPayment = msg.value - creatorPayment;

        // Register echo
        echoesByParent[parentNoteId].push(Echo({
            echoNoteId: echoNoteId,
            parentNoteId: parentNoteId,
            echoBroadcaster: msg.sender,
            parentBroadcaster: parentBroadcaster,
            timestamp: block.timestamp
        }));

        isEcho[echoNoteId] = true;
        echoParent[echoNoteId] = parentNoteId;
        echoCount[parentNoteId]++;

        // Transfer payments
        if (creatorPayment > 0) {
            (bool sentCreator, ) = parentBroadcaster.call{value: creatorPayment}("");
            require(sentCreator, "Creator payment failed");
        }

        if (platformPayment > 0) {
            (bool sentPlatform, ) = treasury.call{value: platformPayment}("");
            require(sentPlatform, "Platform payment failed");
        }

        emit EchoRegistered(
            parentNoteId,
            echoNoteId,
            msg.sender,
            parentBroadcaster,
            block.timestamp,
            creatorPayment,
            platformPayment
        );
    }

    /**
     * @dev Get all echoes for a parent note
     * @param parentNoteId Parent note ID
     * @return Array of Echo structs
     */
    function getEchoes(string calldata parentNoteId) 
        external 
        view 
        returns (Echo[] memory) 
    {
        return echoesByParent[parentNoteId];
    }

    /**
     * @dev Get echo count for a parent note
     * @param parentNoteId Parent note ID
     * @return Number of echoes
     */
    function getEchoCount(string calldata parentNoteId) 
        external 
        view 
        returns (uint256) 
    {
        return echoCount[parentNoteId];
    }

    /**
     * @dev Get parent ID of an echo
     * @param echoNoteId Echo note ID
     * @return Parent note ID
     */
    function getParent(string calldata echoNoteId) 
        external 
        view 
        returns (string memory) 
    {
        require(isEcho[echoNoteId], "Not an echo");
        return echoParent[echoNoteId];
    }

    /**
     * @dev Check if a note is an echo
     * @param noteId Note ID to check
     * @return bool Whether it's an echo
     */
    function checkIsEcho(string calldata noteId) 
        external 
        view 
        returns (bool) 
    {
        return isEcho[noteId];
    }

    /**
     * @dev Update treasury address (owner only)
     * @param newTreasury New treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }

    /**
     * @dev Get echo fee
     */
    function getEchoFee() external pure returns (uint256) {
        return ECHO_FEE;
    }
}
