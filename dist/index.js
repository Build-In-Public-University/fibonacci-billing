"use strict";
/**
 * fibonacci-billing
 * A flexible Node.js package that implements Fibonacci sequence-based subscription billing.
 *
 * @license MIT
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FibonacciBillingVisualizer = exports.FibonacciPaddleIntegration = exports.FibonacciStripeIntegration = exports.FibonacciBilling = void 0;
// Core exports
var fibonacci_billing_1 = require("./core/fibonacci-billing");
Object.defineProperty(exports, "FibonacciBilling", { enumerable: true, get: function () { return __importDefault(fibonacci_billing_1).default; } });
// Integrations
var stripe_1 = require("./integrations/stripe");
Object.defineProperty(exports, "FibonacciStripeIntegration", { enumerable: true, get: function () { return __importDefault(stripe_1).default; } });
var paddle_1 = require("./integrations/paddle");
Object.defineProperty(exports, "FibonacciPaddleIntegration", { enumerable: true, get: function () { return __importDefault(paddle_1).default; } });
// UI Components
var react_1 = require("./ui/react");
Object.defineProperty(exports, "FibonacciBillingVisualizer", { enumerable: true, get: function () { return __importDefault(react_1).default; } });
// Types
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map