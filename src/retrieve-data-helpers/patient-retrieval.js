import queryString from 'query-string';
import axios from 'axios';
import store from '../store/store';
import { signalSuccessPatientRetrieval, signalFailurePatientRetrieval } from '../actions/patient-actions';

async function fetchFirstPatientId(fhirServer, headers) {
  const result = await axios({
    method: 'get',
    url: `${fhirServer}/Patient?_count=1`,
    headers,
  });

  const bundleEntry = result.data && Array.isArray(result.data.entry)
    ? result.data.entry[0]
    : null;
  const firstPatientId = bundleEntry && bundleEntry.resource && bundleEntry.resource.id;

  if (!firstPatientId) {
    throw new Error('No patient id returned from FHIR server');
  }

  return firstPatientId;
}

/**
 * Retrieve Patient resource from the FHIR server in context with the patient id retrieved from the Redux store or access token (if applicable)
 * and dispatch successful or failed connection to the endpoint on the FHIR server. Additionally, grab Conditions data too, since a list of conditions
 * need to be displayed under the Rx View (order-select workflow).
 * @returns {Promise} - Promise to resolve elsewhere
 */
async function retrievePatient(testPatient) {
  try {
    let patient = testPatient || '';
    const { accessToken } = store.getState().fhirServerState;
    const fhirServer = store.getState().fhirServerState.currentFhirServer;
    const headers = {
      Accept: 'application/json+fhir',
    };

    // Grab patient ID from access token (if Sandbox launched securely)
    // Otherwise grab patient ID from query parameters, or localStorage cache, or default patient ID in store
    if (accessToken) {
      if (!patient) {
        ({ patient } = accessToken);
      }
      headers.Authorization = `Bearer ${accessToken.access_token}`;
    }

    if (!patient) {
      const parsed = queryString.parse(window.location.search);
      patient = parsed.patientId
        || localStorage.getItem('PERSISTED_patientId')
        || store.getState().patientState.defaultPatientId;
    }

    if (!patient) {
      patient = await fetchFirstPatientId(fhirServer, headers);
    }

    if (!patient) {
      throw new Error('Patient id is required to retrieve patient');
    }

    const result = await axios({
      method: 'get',
      url: `${fhirServer}/Patient/${patient}`,
      headers,
    });

    if (!result.data || result.data.resourceType !== 'Patient') {
      throw new Error('Invalid patient response');
    }

    try {
      const conditionsResult = await axios({
        method: 'get',
        url: `${fhirServer}/Condition?patient=${patient}`,
        headers,
      });

      store.dispatch(signalSuccessPatientRetrieval(result.data, conditionsResult.data));
      return;
    } catch (conditionsError) {
      console.error('Could not retrieve conditions for patient', conditionsError);
      store.dispatch(signalSuccessPatientRetrieval(result.data));
      return;
    }
  } catch (err) {
    console.error('Could not retrieve default patient from current FHIR server', err);
    store.dispatch(signalFailurePatientRetrieval());
    throw err;
  }
}

export default retrievePatient;
