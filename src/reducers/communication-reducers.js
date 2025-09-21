/*

Reducers for communication resources

        {
          "resource": {
            "resourceType": "CommunicationRequest",
            "id": "commreq-002",
            "status": "active",
            "subject": {
              "reference": "Patient/patient-98765"
            },
            "payload": [
              {
                "contentString": "Please notify the primary care physician that a new antibiotic was ordered."
              }
            ],
            "priority": "routine",
            "authoredOn": "2025-09-21T08:15:00Z"
          }
        }

*/

import moment from 'moment';
import * as types from '../actions/action-types';

// Helper to create FHIR CommunicationRequest resource
export const createFhirCommunicationResource = (patientId, state) => {
  const safeState = state || {};
  return {
    resourceType: 'CommunicationRequest',
    id: `commreq-${moment().format('YYYYMMDDHHmmss')}`,
    status: 'active',
    subject: {
      reference: `Patient/${patientId}`,
    },
    payload: [
      {
        contentString: safeState.message || '',
      },
    ],
    priority: safeState.priority || 'routine',
    authoredOn: moment().toISOString(),
  };
};

const initialState = {
  /**
   * The message content for the CommunicationRequest
   */
  message: '',
  /**
   * The priority of the CommunicationRequest
   */
  priority: 'routine',
  /**
   * The recipient of the CommunicationRequest (e.g., practitioner, organization)
   */
  recipient: '',
  /**
   * The authoredOn date for the CommunicationRequest
   */
  authoredOn: moment().toISOString(),
};

const communicationReducers = (state = initialState, action) => {
  switch (action.type) {
    // Store the message content
    case types.STORE_USER_MED_INPUT: {
      return {
        ...state,
        message: action.input,
      };
    }

    // Store message via dedicated communication action
    case types.STORE_COMMUNICATION_MESSAGE: {
      return {
        ...state,
        message: action.message,
      };
    }

    // Store the priority
    case types.STORE_MED_DOSAGE_AMOUNT: {
      return {
        ...state,
        priority: action.priority || state.priority,
      };
    }

    // Store the recipient
    case types.STORE_USER_CONDITION: {
      return {
        ...state,
        recipient: action.condition || state.recipient,
      };
    }

    // Store the authoredOn date
    case types.STORE_DATE: {
      return {
        ...state,
        authoredOn: action.date,
      };
    }

    // Reset communication state
    case types.RESET_SERVICES: {
      return { ...initialState };
    }

    default:
      return state;
  }
};

export { communicationReducers };