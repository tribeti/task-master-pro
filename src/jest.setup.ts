import '@testing-library/jest-dom'
import 'whatwg-fetch'
import { TextEncoder, TextDecoder as NodeTextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = NodeTextDecoder as typeof global.TextDecoder;
