// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VoiceNoteNFT
 * @dev ERC-721 NFT for Midnight Radio voice notes
 * 
 * Features:
 * - 3 free mints per day per wallet
 * - 0.001 MNT fee after free tier
 * - 2.5% royalty on secondary sales (ERC-2981)
 * - Audio notes become "ghosts" after 24hr (metadata updated, NFT remains)
 */
contract VoiceNoteNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    // Constants
    uint256 public constant FREE_MINTS_PER_DAY = 3;
    uint256 public constant MINT_FEE = 0.001 ether; // 0.001 MNT
    uint96 public constant ROYALTY_FEE = 250; // 2.5% (basis points)

    // State
    uint256 private _nextTokenId;
    address public treasury;

    // Track daily mints per wallet
    mapping(address => uint256) public lastMintDay;
    mapping(address => uint256) public dailyMintCount;

    // Note metadata
    struct NoteData {
        string noteId;           // UUID from backend
        address broadcaster;     // Original creator
        uint256 createdAt;       // Timestamp
        uint256 expiresAt;       // Audio expires after 24hr
        bool isGhost;            // True if audio has expired
    }
    mapping(uint256 => NoteData) public notes;

    // Events
    event VoiceNoteMinted(
        uint256 indexed tokenId,
        string noteId,
        address indexed broadcaster,
        uint256 expiresAt
    );
    event VoiceNoteGhosted(uint256 indexed tokenId, string noteId);

    constructor(address _treasury) ERC721("Midnight Radio", "MNIGHT") Ownable(msg.sender) {
        treasury = _treasury;
        _setDefaultRoyalty(_treasury, ROYALTY_FEE);
    }

    /**
     * @dev Get the current day number for tracking free mints
     */
    function _getCurrentDay() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    /**
     * @dev Check if user has free mints remaining today
     */
    function getFreeMintRemaining(address user) public view returns (uint256) {
        uint256 currentDay = _getCurrentDay();
        if (lastMintDay[user] != currentDay) {
            return FREE_MINTS_PER_DAY;
        }
        if (dailyMintCount[user] >= FREE_MINTS_PER_DAY) {
            return 0;
        }
        return FREE_MINTS_PER_DAY - dailyMintCount[user];
    }

    /**
     * @dev Calculate mint fee (0 if free mints available)
     */
    function getMintFee(address user) public view returns (uint256) {
        return getFreeMintRemaining(user) > 0 ? 0 : MINT_FEE;
    }

    /**
     * @dev Mint a new voice note NFT
     * @param to Recipient address (broadcaster)
     * @param noteId UUID from backend
     * @param metadataUri IPFS URI for NFT metadata
     */
    function mint(
        address to,
        string calldata noteId,
        string calldata metadataUri
    ) external payable returns (uint256) {
        uint256 fee = getMintFee(to);
        require(msg.value >= fee, "Insufficient mint fee");

        // Update daily mint tracking
        uint256 currentDay = _getCurrentDay();
        if (lastMintDay[to] != currentDay) {
            lastMintDay[to] = currentDay;
            dailyMintCount[to] = 0;
        }
        dailyMintCount[to]++;

        // Mint NFT
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataUri);

        // Store note data
        uint256 expiresAt = block.timestamp + 24 hours;
        notes[tokenId] = NoteData({
            noteId: noteId,
            broadcaster: to,
            createdAt: block.timestamp,
            expiresAt: expiresAt,
            isGhost: false
        });

        // Transfer fee to treasury
        if (msg.value > 0) {
            (bool sent, ) = treasury.call{value: msg.value}("");
            require(sent, "Failed to send fee");
        }

        emit VoiceNoteMinted(tokenId, noteId, to, expiresAt);
        return tokenId;
    }

    /**
     * @dev Mark a note as "ghost" (audio expired, NFT remains)
     * Can be called by anyone after expiry
     */
    function markAsGhost(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        require(!notes[tokenId].isGhost, "Already ghosted");
        require(block.timestamp >= notes[tokenId].expiresAt, "Not expired yet");

        notes[tokenId].isGhost = true;
        emit VoiceNoteGhosted(tokenId, notes[tokenId].noteId);
    }

    /**
     * @dev Check if a note's audio has expired
     */
    function isExpired(uint256 tokenId) public view returns (bool) {
        return block.timestamp >= notes[tokenId].expiresAt;
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
        _setDefaultRoyalty(_treasury, ROYALTY_FEE);
    }

    /**
     * @dev Withdraw any stuck funds
     */
    function withdraw() external onlyOwner {
        (bool sent, ) = treasury.call{value: address(this).balance}("");
        require(sent, "Failed to withdraw");
    }

    // Required overrides
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
