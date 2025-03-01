"use strict";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importStar(require("react"));
const fibonacci_billing_1 = __importDefault(require("../../core/fibonacci-billing"));
// CSS styles
const styles = {
    container: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif',
        maxWidth: '800px',
        margin: '0 auto',
    },
    billingSummary: {
        backgroundColor: '#f5f7fa',
        borderRadius: '8px',
        padding: '20px',
        marginBottom: '30px',
    },
    summaryStats: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '15px',
    },
    stat: {
        display: 'flex',
        flexDirection: 'column',
    },
    label: {
        fontSize: '14px',
        color: '#64748b',
        marginBottom: '5px',
    },
    value: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#334155',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '20px',
    },
    cell: {
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '1px solid #e2e8f0',
    },
    headerCell: {
        padding: '12px 15px',
        textAlign: 'left',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#f8fafc',
        fontWeight: 600,
        color: '#475569',
    },
    row: {
    // Empty object for base row style
    },
    rowHover: {
        backgroundColor: '#f1f5f9',
    }
};
/**
 * Component for visualizing Fibonacci billing schedules
 */
const FibonacciBillingVisualizer = ({ basePrice = 19.99, discountRate = 0.08, capTerm = false, maxTerm = 0, cycles = 8 }) => {
    const [schedule, setSchedule] = (0, react_1.useState)([]);
    const [summary, setSummary] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        const billing = new fibonacci_billing_1.default({
            basePrice,
            discountRate,
            capTerm,
            maxTerm
        });
        setSchedule(billing.generateBillingSchedule(cycles));
        setSummary(billing.getBillingSummary(cycles));
    }, [basePrice, discountRate, capTerm, maxTerm, cycles]);
    if (schedule.length === 0 || !summary) {
        return react_1.default.createElement("div", null, "Loading billing information...");
    }
    return (react_1.default.createElement("div", { style: styles.container },
        react_1.default.createElement("div", { style: styles.billingSummary },
            react_1.default.createElement("h3", null, "Billing Summary"),
            react_1.default.createElement("div", { style: styles.summaryStats },
                react_1.default.createElement("div", { style: styles.stat },
                    react_1.default.createElement("span", { style: styles.label }, "Total Months:"),
                    react_1.default.createElement("span", { style: styles.value }, summary.totalMonths)),
                react_1.default.createElement("div", { style: styles.stat },
                    react_1.default.createElement("span", { style: styles.label }, "Total Amount:"),
                    react_1.default.createElement("span", { style: styles.value },
                        "$",
                        summary.totalAmount.toFixed(2))),
                react_1.default.createElement("div", { style: styles.stat },
                    react_1.default.createElement("span", { style: styles.label }, "Total Savings:"),
                    react_1.default.createElement("span", { style: styles.value },
                        "$",
                        summary.totalSavings.toFixed(2),
                        " (",
                        summary.savingsPercentage,
                        "%)")),
                react_1.default.createElement("div", { style: styles.stat },
                    react_1.default.createElement("span", { style: styles.label }, "Effective Monthly Rate:"),
                    react_1.default.createElement("span", { style: styles.value },
                        "$",
                        summary.effectiveMonthlyRate.toFixed(2))))),
        react_1.default.createElement("div", null,
            react_1.default.createElement("h3", null, "Billing Schedule"),
            react_1.default.createElement("table", { style: styles.table },
                react_1.default.createElement("thead", null,
                    react_1.default.createElement("tr", null,
                        react_1.default.createElement("th", { style: styles.headerCell }, "Cycle"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Term (Months)"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Base Amount"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Discount"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Final Amount"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Savings"),
                        react_1.default.createElement("th", { style: styles.headerCell }, "Monthly Rate"))),
                react_1.default.createElement("tbody", null, schedule.map((cycle) => (react_1.default.createElement("tr", { key: cycle.cycle, style: {}, onMouseOver: (e) => e.currentTarget.style.backgroundColor = '#f1f5f9', onMouseOut: (e) => e.currentTarget.style.backgroundColor = '' },
                    react_1.default.createElement("td", { style: styles.cell }, cycle.cycle),
                    react_1.default.createElement("td", { style: styles.cell }, cycle.termMonths),
                    react_1.default.createElement("td", { style: styles.cell },
                        "$",
                        cycle.baseAmount.toFixed(2)),
                    react_1.default.createElement("td", { style: styles.cell },
                        cycle.discount,
                        "%"),
                    react_1.default.createElement("td", { style: styles.cell },
                        "$",
                        cycle.finalAmount.toFixed(2)),
                    react_1.default.createElement("td", { style: styles.cell },
                        "$",
                        cycle.savingsAmount.toFixed(2)),
                    react_1.default.createElement("td", { style: styles.cell },
                        "$",
                        cycle.effectiveMonthlyRate.toFixed(2))))))))));
};
exports.default = FibonacciBillingVisualizer;
//# sourceMappingURL=FibonacciBillingVisualizer.js.map