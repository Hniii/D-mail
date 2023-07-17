// SPDX-License-Identifier: UNLICENSED0
pragma solidity ^0.8.9;

import "./Structures.sol";
import { Chat } from "./Chat.sol";

contract Operations {
    Structures structures;
    Chat chat;

    constructor() {
        structures = Structures(0xA440CEa9ac75b67A47e9D9383AacD0ce63C1f32E);
        chat = Chat(0x5af34e0b0ef59850cc1D917005534751Ec1FD811);
    }

struct Draft {
        uint256 id;
        address sender;
        string subject;
        string message;
        bool shareable;
        address[] receivers;
        string receiversArray;
        string fileHash;
    }
    Draft[] public drafts;

    uint256 draftCount;

    function saveDraft(string calldata subject, string calldata message, bool shareable, address[] calldata receivers, string memory receiversString, string calldata fileHash) external {
        Draft memory newDraft = Draft(draftCount, msg.sender, subject, message, shareable, receivers, receiversString, fileHash);
        draftCount++;
        drafts.push(newDraft);
    }

     function getDrafts(string memory email) external view returns (Draft[] memory) {
        uint count = 0;
        for (uint i = 0; i < drafts.length; i++) {
            if (drafts[i].sender == structures.getAddress(email)) {
                count++;
            }
        }
        Draft[] memory draft = new Draft[](count);
        uint index = 0;
        for (uint i = 0; i < drafts.length; i++) {
            if (drafts[i].sender == structures.getAddress(email)) {
                draft[index] = drafts[i];
                index++;
            }
        }
        return draft;
        }
    
    function deleteDraft(uint draftId) external {
    for (uint i = 0; i < drafts.length; i++) {
        if (drafts[i].id == draftId) {
            drafts[i] = drafts[drafts.length - 1];
            drafts.pop();
            break; 
        }
    }
}

    function getMessagesCount(string memory email) public view returns (uint) {
        uint count = 0;
        Chat.Message[] memory messages = chat.getAllArays();

        for (uint i = 0; i < messages.length; i++) {
            if (messages[i].sender == structures.getAddress(email)) {
                count++;
            }
        }
        return count;
    }


    function MessageSent(string memory email) public view returns (Chat.Message[] memory) {
        uint count = 0;
        Chat.Message[] memory messages = chat.getAllArays();

        for (uint i = 0; i < messages.length; i++) {
            if (
                chat.getRep(messages[i].originalMessageId) == false &&
                (messages[i].sender == structures.getAddress(email)) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBySender) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBoth)
            ) {
                count++;
            }
        }

        Chat.Message[] memory messagesSent = new Chat.Message[](count);
        uint index = 0;

        for (uint i = 0; i < messages.length; i++) {
            if (
                chat.getRep(messages[i].originalMessageId) == false &&
                (messages[i].sender == structures.getAddress(email)) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBySender) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBoth)
            ) {
                messagesSent[index] = messages[i];
                index++;
            }
        }

        return messagesSent;
    }

    function MessageReceived(string memory email) public view returns (Chat.Message[] memory) {
        uint count = 0;
        Chat.Message[] memory messages = chat.getAllArays();

        for (uint i = 0; i < messages.length; i++) {
            if (
                chat.getRep(messages[i].originalMessageId) == false &&
                (messages[i].receiver == structures.getAddress(email)) &&
                (messages[i].timestamp <= block.timestamp) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedByReceiver) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBoth)
            ) {
                count++;
            }
        }

        Chat.Message[] memory messagesReceived = new Chat.Message[](count);
        uint index = 0;

        for (uint i = 0; i < messages.length; i++) {
            if (
                chat.getRep(messages[i].originalMessageId) == false &&
                (messages[i].receiver == structures.getAddress(email)) &&
                (messages[i].timestamp <= block.timestamp) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedByReceiver) &&
                (messages[i].deleted != Chat.DeletionStatus.DeletedBoth)
            ) {
                messagesReceived[index] = messages[i];
                index++;
            }
        }

        return messagesReceived;
    }
    
}
