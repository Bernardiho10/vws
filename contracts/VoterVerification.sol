// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract VoterVerification {
    struct Verification {
        string imageHash;
        uint256 timestamp;
        bool faceDetected;
        uint256 confidence;
        bool isValid;
    }

    mapping(address => Verification) public verifications;
    mapping(string => bool) public usedImageHashes;

    event VerificationStored(
        address indexed voter,
        string imageHash,
        uint256 timestamp,
        bool faceDetected,
        uint256 confidence
    );

    event VerificationInvalidated(address indexed voter, string imageHash);

    modifier onlyVerified() {
        require(verifications[msg.sender].isValid, "Voter not verified");
        _;
    }

    function storeVerification(
        string memory _imageHash,
        uint256 _timestamp,
        bool _faceDetected,
        uint256 _confidence
    ) external {
        require(!usedImageHashes[_imageHash], "Image hash already used");
        require(_faceDetected, "Face not detected in image");
        require(_confidence >= 50, "Confidence score too low"); // Assuming confidence is 0-100

        // Store verification
        verifications[msg.sender] = Verification({
            imageHash: _imageHash,
            timestamp: _timestamp,
            faceDetected: _faceDetected,
            confidence: _confidence,
            isValid: true
        });

        // Mark image hash as used
        usedImageHashes[_imageHash] = true;

        emit VerificationStored(
            msg.sender,
            _imageHash,
            _timestamp,
            _faceDetected,
            _confidence
        );
    }

    function invalidateVerification(address _voter) external {
        require(msg.sender == _voter, "Only voter can invalidate their verification");
        require(verifications[_voter].isValid, "Verification already invalid");

        string memory imageHash = verifications[_voter].imageHash;
        verifications[_voter].isValid = false;

        emit VerificationInvalidated(_voter, imageHash);
    }

    function isVerified(address _voter) external view returns (bool) {
        return verifications[_voter].isValid;
    }

    function getVerification(address _voter)
        external
        view
        returns (
            string memory imageHash,
            uint256 timestamp,
            bool faceDetected,
            uint256 confidence,
            bool isValid
        )
    {
        Verification memory v = verifications[_voter];
        return (v.imageHash, v.timestamp, v.faceDetected, v.confidence, v.isValid);
    }
} 