// SPDX-License-Identifier: UNLICENSED0
pragma solidity ^0.8.9;

import "./Structures.sol";
import "./strings.sol";

contract Chat {
    using strings for *;

    Structures structures;
     constructor() {
    structures = Structures(0xA440CEa9ac75b67A47e9D9383AacD0ce63C1f32E);
}
    enum DeletionStatus {
        NotDeleted,
        DeletedBySender,
        DeletedByReceiver,
        DeletedBoth
    }

     struct Message {
        uint256 id;
        address sender;
        address receiver;
        string subject;
        string message;
        uint256 timestamp;
        bool read;
        bool shareable;
        address[] viewedBy;
        uint256 originalMessageId;
        string fileHash;
        string receiversGroup;
        DeletionStatus deleted;
    }
    
    mapping(uint256 => bool) public rep;

    struct Reply {
       Message [] responses;
       bool rep;
    }

    mapping (uint256 => Reply) public replies;
    Message[] public messages;

function getRep(uint256 id) public view returns(bool){
    return rep[id];
}

function getAllArays() public view returns(Message[] memory) {
    return messages;
}

function getReplies(uint256 id) public view returns(Reply memory) {
    return replies[id];
}


   function replyTo(string memory response, string memory fileHash, Message memory messageOriginal, uint256 timestamp) external {
    bool conditionMet = false;
    if (replies[messageOriginal.originalMessageId].responses.length == 0) {
        for (uint i = 0; i < messages.length && !conditionMet; i++) {
            if (messages[i].originalMessageId == messageOriginal.originalMessageId) {
                messages[i].read = false;
                conditionMet = true;
            }
        }
        replies[messageOriginal.originalMessageId].responses.push(messageOriginal);
        addReply(response, fileHash, messageOriginal, true, timestamp);
    } else {
        addReply(response, fileHash, messageOriginal, false, timestamp);
    }
}


function addReply(string memory response, string memory fileHash, Message memory messageOriginal, bool setRep, uint256 timestamp) private {
    uint256 messageTimestamp = (timestamp != 0) ? timestamp : block.timestamp;
    address wallet = (msg.sender !=  messageOriginal.sender) ? messageOriginal.sender : messageOriginal.receiver;
    string memory receiver = (msg.sender !=  messageOriginal.sender) ? messageOriginal.receiversGroup : structures.getEmailByAddress(messageOriginal.receiver);
    Message memory message = Message(
        messageCount,
        msg.sender,
        wallet,
        messageOriginal.subject,
        response,
        messageTimestamp,
        false,
        false,
        new address[](0),
        messageCount,
        fileHash,
        receiver,
        DeletionStatus.NotDeleted
    );
    rep[messageCount] = true;
    messages.push(message);
    replies[messageOriginal.originalMessageId].responses.push(message);

    if (setRep) {
        replies[messageOriginal.originalMessageId].rep = true;
    }

    messageCount++;
}

    uint256 messageCount;
    uint256 shareCount;

      struct Share {
        uint256 messageId;
        uint256 timestamp;
        address sender;
        address receiver;
    }
    

     Share[] public shares;

      function sendMessage(
        address receiver,
        string calldata subject,
        string memory message,
        bool isShareable,
        string memory fileHash,
        string memory receiverGroup,
        uint256 timestamp
    ) external {
        require(
            structures.checkUserExists(msg.sender) == true,
            "You must have an account"
        );
        require(structures.checkUserExists(receiver) == true, "Recipient does not exist");

        uint256 messageTimestamp = (timestamp != 0) ? timestamp : block.timestamp;

        Message memory message = Message(
            messageCount,
            msg.sender,
            receiver,
            subject,
            message,
            messageTimestamp,
            false,
            isShareable,
                new address[](0),
                messageCount,
            fileHash,
            receiverGroup,
            DeletionStatus.NotDeleted
        );
        rep[messageCount] = false;
        messages.push(message);
        messageCount++;
    }

    function splitStringBySpaces(string memory input) public pure returns (string[] memory) {
    strings.slice memory inputSlice = input.toSlice();
    strings.slice memory delimiter = " ".toSlice();

    string[] memory parts = new string[](inputSlice.count(delimiter) + 1);
    for (uint256 i = 0; i < parts.length; i++) {
        parts[i] = inputSlice.split(delimiter).toString();
    }

    return parts;
}

   function sendMessageToGroup(address[] memory receivers,  address []memory receiversCci, string []memory messageData,bool isShareble, string memory emailGroup, uint256 timestamp) external {
        require(
            structures.checkUserExists(msg.sender) == true,
            "You must have an account"
        );

        uint256 messageTimestamp = (timestamp != 0) ? timestamp : block.timestamp;

        for(uint i = 0; i<receivers.length; i++){
            string[] memory data = splitStringBySpaces(messageData[i]);
            
            require(structures.checkUserExists(receivers[i]) == true, "Recipient does not exist");
            Message memory message = Message(messageCount, msg.sender, receivers[i], data[0], data[1], messageTimestamp, false, isShareble,
                new address[](0),
                messageCount, data[2], emailGroup,DeletionStatus.NotDeleted);
                rep[messageCount] = false;
        messages.push(message);
        messageCount++;
        }
        for(uint i = receivers.length; i<(receiversCci.length + receivers.length); i++){
            string[] memory dataCci = splitStringBySpaces(messageData[i]);
            require(structures.checkUserExists(receiversCci[i-receivers.length]) == true, "Recipient does not exist");
            Message memory message = Message(messageCount, msg.sender, receiversCci[i-receivers.length], dataCci[0], dataCci[1], messageTimestamp, false, isShareble,
                new address[](0),
                messageCount,dataCci[2], '',DeletionStatus.NotDeleted);
                rep[messageCount] = false;
        messages.push(message);
        messageCount++;
        }

        }      

         function shareMessage(uint256 messageId, string[] memory encryptedSubjects, string[] memory encryptedMessages, string[] memory encryptedHashes, address[] calldata receivers, string memory emailGroup) external {
    require(messageId < messages.length, "Invalid message ID");
    require(structures.checkUserExists(msg.sender) == true, "You must have an account");
    Message storage messageToShare = messages[messageId];
    uint256 originalMessageid = messages[messageId].originalMessageId;
    require(messageToShare.shareable == true, "Message is not shareable");

    for (uint256 i = 0; i < receivers.length; i++) {
        require(structures.checkUserExists(receivers[i]), "Receiver does not exist");
        Share memory newShare = Share(messageId, block.timestamp, msg.sender, receivers[i]);
        shares.push(newShare);

        // Set the originalMessageId of the shared message to the ID of the original message
        Message memory sharedMessage = Message(
            messageCount,
            msg.sender,
            receivers[i],
            encryptedSubjects[i],
            encryptedMessages[i],
            block.timestamp,
            false,
            true,
            new address[](0),
            messages[messageId].originalMessageId,
            encryptedHashes[i],
            emailGroup,
            DeletionStatus.NotDeleted
        );
        messageCount++;
        messages.push(sharedMessage);
        rep[messageCount] = false;
    }
    shareCount++;
}


    function getViewedBy(uint256 messageId) public view returns (address[] memory) {
        return messages[messageId].viewedBy;
    }

function viewMessage(uint256 messageId) public {
    uint256 originalMessageid = messages[messageId].originalMessageId;
    messages[messageId].read= true;
    messages[originalMessageid].read= true;

    bool found = false;
    for (uint256 i = 0; i < messages[messageId].viewedBy.length; i++) {
        if (messages[messageId].viewedBy[i] == msg.sender) {
            found = true;
            break;
        }
    }
    if (!found) {
        messages[messageId].viewedBy.push(msg.sender);
    }

    found = false;
    for (uint256 i = 0; i < messages[originalMessageid].viewedBy.length; i++) {
        if (messages[originalMessageid].viewedBy[i] == msg.sender) {
            found = true;
            break;
        }
    }
    if (!found) {
        messages[originalMessageid].viewedBy.push(msg.sender);
    }
}

function getShares(uint256 messageId) external view returns (Share[] memory) {
        require(messageId < messages.length, "Invalid message ID");

        uint256 count = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            if (messages[messageId].originalMessageId == messageId ) {
                count++;
            }
        }
        Share[] memory messageShares = new Share[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < shares.length; i++) {
            if (messages[messageId].originalMessageId == messageId) {
                messageShares[index] = shares[i];
                index++;
            }
        }
        return messageShares;
    }

function deleteMessage(address walletAddress, uint256 id) public {
    require(structures.checkUserExists(walletAddress), "User with given address does not exist.");

    Message storage message = messages[id];
    if (message.sender == walletAddress) {
        message.deleted = message.deleted == DeletionStatus.DeletedByReceiver ? DeletionStatus.DeletedBoth : DeletionStatus.DeletedBySender;
    }
    if (message.receiver == walletAddress) {
        message.deleted = message.deleted == DeletionStatus.DeletedBySender ? DeletionStatus.DeletedBoth : DeletionStatus.DeletedByReceiver;
    }
}
}