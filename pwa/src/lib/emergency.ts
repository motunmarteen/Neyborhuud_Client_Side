/**
 * Nigeria's emergency numbers, in one place (owner 2026-11-27: "use 112 in all the SOS and other
 * places"). 112 is the national emergency number: free from any network, it reaches police,
 * fire, ambulance and FRSC in every state (NCC; approved by the National Economic Council as the
 * single national line in April 2026). Show this number and no other "call" numbers, so a person
 * in a panic only has to remember one.
 *
 * 112 can't receive texts, so the police text/WhatsApp line is kept only for sending written
 * details. The server's copy is in `NeyborHuud-ServerSide/src/modules/safety/agency.integration.ts`.
 */
export const EMERGENCY_NUMBER = '112';
export const EMERGENCY_TEL = `tel:${EMERGENCY_NUMBER}`;
export const POLICE_TEXT_NUMBER = '08057000003';
