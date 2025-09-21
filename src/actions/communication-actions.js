import * as types from './action-types';

// Store free-form communication message for CommunicationRequest.payload[0].contentString
export const storeCommunicationMessage = (message) => ({
  type: types.STORE_COMMUNICATION_MESSAGE,
  message,
});
