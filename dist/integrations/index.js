"use strict";
/**
 * Payment integrations for Fibonacci Billing
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FibonacciPaddleIntegration = exports.FibonacciStripeIntegration = void 0;
const stripe_1 = __importDefault(require("./stripe"));
exports.FibonacciStripeIntegration = stripe_1.default;
const paddle_1 = __importDefault(require("./paddle"));
exports.FibonacciPaddleIntegration = paddle_1.default;
//# sourceMappingURL=index.js.map