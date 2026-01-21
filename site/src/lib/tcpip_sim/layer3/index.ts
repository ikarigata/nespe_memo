/**
 * Layer 3 (ネットワーク層) エクスポート
 */

// IP Address
export type {
  IpAddressString,
  SubnetMaskString,
  CidrNotation,
  SubnetInfo,
} from './IpAddress';
export {
  DEFAULT_SUBNET_MASK,
  IP_BROADCAST,
  IP_LOOPBACK,
  isValidIpAddress,
  ipToNumber,
  numberToIp,
  isSameNetwork,
  prefixToSubnetMask,
  subnetMaskToPrefix,
  getNetworkAddress,
  getBroadcastAddress,
  getSubnetInfo,
  parseCidr,
  getSubnetInfoFromCidr,
  isInSubnet,
} from './IpAddress';

// IP Packet
export type { IpHeader, IpPacket, L3Payload, IcmpPacketData } from './IpPacket';
export {
  IpProtocol,
  DEFAULT_TTL,
  ipProtocolToString,
  isIcmpPacket,
  createIpPacket,
  isIpPacket,
  formatIpPacket,
  decrementTtl,
} from './IpPacket';

// Routing Table
export type { RouteType, RoutingEntry, RouteResult } from './RoutingTable';
export {
  DEFAULT_ROUTE_DESTINATION,
  DEFAULT_ROUTE_MASK,
  RoutingTable,
} from './RoutingTable';

// IP Stack
export type { ITransportLayer, InterfaceConfig } from './IpStack';
export { IpStack } from './IpStack';
