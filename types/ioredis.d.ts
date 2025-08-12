// types/ioredis.d.ts
declare module 'ioredis' {
  // Treat the default export and the class as "any" so TS allows `new Redis(...)`
  const Redis: any;
  export default Redis;
  export { Redis };
}
