import { LifeTask } from '../types';

export const HtmlTemplateService = {
    generateExpenseReport: (
        expenses: LifeTask[],
        dateRange: string,
        totalSpent: number,
        userName: string = 'User'
    ) => {
        const date = new Date().toLocaleDateString();

        // Sort expenses by date
        const sortedExpenses = [...expenses].sort((a, b) =>
            new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
        );

        const rows = sortedExpenses.map(expense => `
            <tr class="item-row">
                <td>${new Date(expense.dueDate).toLocaleDateString()}</td>
                <td>
                    <div class="category-badge category-${expense.category}">
                        ${expense.category.toUpperCase()}
                    </div>
                </td>
                <td>
                    <div class="item-title">${expense.title}</div>
                    ${expense.notes ? `<div class="item-subtitle">${expense.notes}</div>` : ''}
                </td>
                <td class="amount">₹${expense.amount?.toLocaleString()}</td>
            </tr>
        `).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
                <style>
                    body {
                        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                        color: #1e293b;
                        margin: 0;
                        padding: 40px;
                        -webkit-print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #f1f5f9;
                    }
                    .brand {
                        font-size: 24px;
                        font-weight: 800;
                        color: #0f172a;
                        letter-spacing: -0.5px;
                    }
                    .brand span {
                        color: #0ea5e9;
                    }
                    .report-info {
                        text-align: right;
                    }
                    .report-title {
                        font-size: 16px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        margin-bottom: 4px;
                    }
                    .report-date {
                        font-size: 14px;
                        color: #94a3b8;
                    }

                    .summary-cards {
                        display: flex;
                        gap: 20px;
                        margin-bottom: 40px;
                    }
                    .card {
                        flex: 1;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 12px;
                        padding: 20px;
                    }
                    .card-label {
                        font-size: 12px;
                        font-weight: 600;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 8px;
                    }
                    .card-value {
                        font-size: 28px;
                        font-weight: 800;
                        color: #0f172a;
                    }
                    .card-value.primary {
                        color: #0ea5e9;
                    }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                    }
                    th {
                        text-align: left;
                        font-size: 11px;
                        font-weight: 700;
                        color: #64748b;
                        text-transform: uppercase;
                        letter-spacing: 1px;
                        padding: 12px 16px;
                        background: #f8fafc;
                        border-top: 1px solid #e2e8f0;
                        border-bottom: 1px solid #e2e8f0;
                    }
                    td {
                        padding: 16px;
                        border-bottom: 1px solid #f1f5f9;
                        vertical-align: top;
                    }
                    .item-row:last-child td {
                        border-bottom: none;
                    }
                    .item-title {
                        font-weight: 600;
                        color: #334155;
                        font-size: 14px;
                    }
                    .item-subtitle {
                        font-size: 12px;
                        color: #94a3b8;
                        margin-top: 4px;
                    }
                    .amount {
                        text-align: right;
                        font-weight: 700;
                        font-feature-settings: "tnum";
                        color: #0f172a;
                    }
                    
                    .category-badge {
                        display: inline-block;
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 700;
                        letter-spacing: 0.5px;
                    }
                    .category-finance { background: #fee2e2; color: #ef4444; }
                    .category-housing { background: #e0f2fe; color: #0ea5e9; }
                    .category-utility { background: #fef3c7; color: #d97706; }
                    .category-food { background: #dcfce7; color: #22c55e; }
                    .category-transport { background: #f3e8ff; color: #a855f7; }
                    .category-shopping { background: #fce7f3; color: #ec4899; }
                    .category-entertainment { background: #ffedd5; color: #f97316; }
                    .category-other { background: #f1f5f9; color: #64748b; }

                    .footer {
                        margin-top: 60px;
                        padding-top: 20px;
                        border-top: 1px solid #e2e8f0;
                        text-align: center;
                    }
                    .footer-text {
                        font-size: 12px;
                        color: #94a3b8;
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="brand">Daily <span>Admin</span></div>
                    <div class="report-info">
                        <div class="report-title">Expense Report</div>
                        <div class="report-date">${dateRange}</div>
                    </div>
                </div>

                <div class="summary-cards">
                    <div class="card">
                        <div class="card-label">Total Spent</div>
                        <div class="card-value primary">₹${totalSpent.toLocaleString()}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Total Transactions</div>
                        <div class="card-value">${expenses.length}</div>
                    </div>
                    <div class="card">
                        <div class="card-label">Generated On</div>
                        <div class="card-value" style="font-size: 18px; margin-top: 8px;">${date}</div>
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th style="width: 15%">Date</th>
                            <th style="width: 15%">Category</th>
                            <th style="width: 50%">Description</th>
                            <th style="width: 20%; text-align: right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows}
                    </tbody>
                </table>

                <div class="footer">
                    <div class="footer-text">Generated by Daily Admin • Your Personal Finance Assistant</div>
                </div>
            </body>
            </html>
        `;
    }
};
