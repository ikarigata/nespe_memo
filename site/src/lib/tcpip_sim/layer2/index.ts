/**
 * Layer 2 (データリンク層) エクスポート
 */

// Ethernet
export type { EthernetFrame, MacAddress, EtherType, L2Payload } from './EthernetFrame';
export {
  ETHER_TYPE_IPV4,
  ETHER_TYPE_ARP,
  ETHER_TYPE_IPV6,
  ETHER_TYPE_VLAN,
  MAC_BROADCAST,
  MAC_UNKNOWN,
  etherTypeToString,
  isBroadcastMac,
  isValidMacAddress,
} from './EthernetFrame';

// ARP
export type { ArpPacket } from './ArpPacket';
export {
  ArpOperation,
  createArpRequest,
  createArpReply,
  isArpPacket,
  formatArpPacket,
} from './ArpPacket';

// ARP Table
export type { ArpEntry, ArpTableConfig } from './ArpTable';
export { ArpTable, ArpEntryState } from './ArpTable';

// ARP Handler
export type { ArpHandlerConfig } from './ArpHandler';
export { ArpHandler } from './ArpHandler';

// Network Interface (NIC)
export type { INetworkLayer } from './NetworkInterface';
export { NetworkInterface } from './NetworkInterface';

// L2 Switch
export { L2Switch } from './L2Switch';
