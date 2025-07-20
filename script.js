let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let total = expenses.reduce((acc, expense) => acc + expense.amount, 0);
let expenseChart = null;

// Check if a name is already saved in localStorage
function setUserName() {
    let studentName = localStorage.getItem('studentName');

    if (!studentName) {
        studentName = prompt("Please enter your name:");
        if (studentName) {
            localStorage.setItem('studentName', studentName);
        }
    }

    // Update the title with the student's name
    updateTitle(studentName);
}

function updateTitle(name) {
    const trackerTitle = document.getElementById('tracker-title');
    trackerTitle.textContent = `${name}'s Expense Tracker`;
}

// Load the UI with saved data
updateUI();
createExpenseChart();

function addExpense() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const time = document.getElementById('expense-time').value;

    if (description && amount && time) {
        const newExpense = { description, amount, time };
        expenses.push(newExpense);
        total += amount;

        // Save to localStorage
        localStorage.setItem('expenses', JSON.stringify(expenses));

        // Reset input fields
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('expense-time').value = '';

        updateUI();
        createExpenseChart();
    } else {
        alert('Please enter valid expense details and time.');
    }
}


function updateUI() {
    const expenseList = document.getElementById('expense-list');
    const totalExpense = document.getElementById('total-expense');

    expenseList.innerHTML = '';
    expenses.forEach((expense, index) => {
        const expenseItem = document.createElement('div');
        expenseItem.classList.add('expense-item','flex', 'justify-between', 'items-center', 'bg-gray-100','p-4','rounded-md','shadow-sm','border-2','border-gray-300');

        expenseItem.innerHTML = `
            <span>${expense.description}: ₹${expense.amount.toFixed(2)}</span>
            <button onclick="deleteExpense(${index}, this.closest('.expense-item'))" class="text-red-600 hover:text-red-800 focus:outline-none transition-transform duration-200 hover:scale-110">
               🗑️
            </button>
        `;
        expenseList.appendChild(expenseItem);
    });

    totalExpense.textContent = `Total Expenses: ₹${total.toFixed(2)}`;
}

function deleteExpense(index, element) {
    const isConfirmed = confirm("Are you sure you want to delete this expense?");
    if (isConfirmed) {
      element.classList.add("removed");
      setTimeout(() => {
        total -= expenses[index].amount;
        expenses.splice(index, 1);

        // Update localStorage
        localStorage.setItem('expenses', JSON.stringify(expenses));
        updateUI();
        createExpenseChart();
      }, 300);
    }
}

function formatTime(time) {
    const date = new Date(time);
    return date.toLocaleString();
}

function showMonthlyExpenses() {
    const monthlyExpenses = {};
    expenses.forEach(expense => {
        const date = new Date(expense.time);
        const monthYear = `${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;

        if (!monthlyExpenses[monthYear]) {
            monthlyExpenses[monthYear] = 0;
        }
        monthlyExpenses[monthYear] += expense.amount;
    });

    const monthlyExpenseList = document.getElementById('monthly-expense-list');
    monthlyExpenseList.innerHTML = ''; 

    for (const [monthYear, total] of Object.entries(monthlyExpenses)) {
        monthlyExpenseList.innerHTML += `
            <div class="bg-gray-100 border-2 border-gray-300 p-4 rounded-md shadow-sm transition-transform duration-200 hover:scale-105">
                ${monthYear}: ₹${total.toFixed(2)}
            </div>
        `;
    }
}

function showDetailedMonthlyExpenses() {
    const selectedMonth = document.getElementById('month-select').value;
    if (selectedMonth === "") {
        alert("Please select a month.");
        return;
    }

    const detailedMonthlyExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.time);
        return expenseDate.getMonth() === parseInt(selectedMonth);
    });

    const detailedMonthlyExpenseList = document.getElementById('detailed-monthly-expense-list');
    detailedMonthlyExpenseList.innerHTML = '';

    if (detailedMonthlyExpenses.length === 0) {
        detailedMonthlyExpenseList.innerHTML = '<p class="text-gray-500">No expenses found for this month.</p>';
        return;
    }

    detailedMonthlyExpenses.forEach(expense => {
        const expenseDate = new Date(expense.time).toLocaleDateString();
        detailedMonthlyExpenseList.innerHTML += `
            <div class="bg-gray-100 border-2 border-gray-300 p-4 rounded-md shadow-sm transition-transform duration-200 hover:scale-105">
                ${expenseDate}: ${expense.description} - ₹${expense.amount.toFixed(2)}
            </div>
        `;
    });
}

function createExpenseChart() {
    const ctx = document.getElementById('expense-chart').getContext('2d');
    
    // Group expenses by month
    const monthlyData = expenses.reduce((acc, expense) => {
        const date = new Date(expense.time);
        const monthKey = `${date.getMonth() + 1}/${date.getFullYear()}`;
        acc[monthKey] = (acc[monthKey] || 0) + expense.amount;
        return acc;
    }, {});

    // Prepare data for chart
    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);

    // Destroy previous chart if it exists
    if (expenseChart) {
        expenseChart.destroy();
    }

    // Create new chart
    expenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Monthly Expenses (₹)',
                data: data,
                backgroundColor: 'rgba(79, 70, 229,0.8)',
                borderColor: 'rgba(79, 70, 229,1)',
                borderWidth: 1
            }]
        },
         options: {
             responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Expense Amount (₹)'
                    }
                }
            }
        }
    });
}

function downloadData() {
    if (expenses.length === 0) {
        alert("No data to download.");
        return;
    }

    const csvContent = "Description,Amount,Time\n" + expenses.map(exp => 
        `${exp.description},${exp.amount},${exp.time}`).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "expense_data.csv";
    link.click();
}

function downloadExcelData() {
    if (expenses.length === 0) {
        alert("No data to download.");
        return;
    }

    const ws_data = [["Description", "Amount", "Time"]];
    expenses.forEach(exp => {
        ws_data.push([exp.description, exp.amount, exp.time]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, "expense_data.xlsx");
}

// Call the setUserName function when the page loads
setUserName();