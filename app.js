(function () {
  "use strict";

  var STORAGE_KEY = "student-expense-tracker:expenses";

  var form = document.getElementById("expense-form");
  var amountInput = document.getElementById("amount");
  var categoryInput = document.getElementById("category");
  var dateInput = document.getElementById("date");
  var descriptionInput = document.getElementById("description");
  var formError = document.getElementById("form-error");
  var monthInput = document.getElementById("month-input");
  var expenseList = document.getElementById("expense-list");
  var emptyState = document.getElementById("empty-state");
  var grandTotalEl = document.getElementById("grand-total");
  var categoryTotalsEl = document.getElementById("category-totals");

  function todayMonth() {
    var d = new Date();
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  }

  function loadExpenses() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function saveExpenses(expenses) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
  }

  function formatAmount(value) {
    return value.toLocaleString("ru-RU", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function showError(message) {
    formError.textContent = message;
    formError.hidden = false;
  }

  function clearError() {
    formError.hidden = true;
    formError.textContent = "";
  }

  var expenses = loadExpenses();

  function expensesForMonth(month) {
    return expenses.filter(function (item) {
      return item.date && item.date.slice(0, 7) === month;
    });
  }

  function render() {
    var month = monthInput.value || todayMonth();
    var monthly = expensesForMonth(month);

    expenseList.innerHTML = "";

    if (monthly.length === 0) {
      emptyState.hidden = false;
    } else {
      emptyState.hidden = true;
      monthly
        .slice()
        .sort(function (a, b) {
          return b.date.localeCompare(a.date);
        })
        .forEach(function (item) {
          expenseList.appendChild(renderExpenseItem(item));
        });
    }

    var grandTotal = 0;
    var categoryTotals = {};
    monthly.forEach(function (item) {
      grandTotal += item.amount;
      categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
    });

    grandTotalEl.textContent = formatAmount(grandTotal);

    categoryTotalsEl.innerHTML = "";
    Object.keys(categoryTotals)
      .sort(function (a, b) {
        return categoryTotals[b] - categoryTotals[a];
      })
      .forEach(function (category) {
        var li = document.createElement("li");
        var nameSpan = document.createElement("span");
        nameSpan.textContent = category;
        var valueSpan = document.createElement("span");
        valueSpan.textContent = formatAmount(categoryTotals[category]);
        li.appendChild(nameSpan);
        li.appendChild(valueSpan);
        categoryTotalsEl.appendChild(li);
      });
  }

  function renderExpenseItem(item) {
    var li = document.createElement("li");
    li.className = "expense-item";

    var info = document.createElement("div");
    info.className = "expense-item__info";

    var category = document.createElement("span");
    category.className = "expense-item__category";
    category.textContent = item.category;

    var meta = document.createElement("span");
    meta.className = "expense-item__meta";
    meta.textContent = item.date + (item.description ? " · " + item.description : "");

    info.appendChild(category);
    info.appendChild(meta);

    var amount = document.createElement("span");
    amount.className = "expense-item__amount";
    amount.textContent = formatAmount(item.amount);

    var deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "expense-item__delete";
    deleteBtn.textContent = "Удалить";
    deleteBtn.addEventListener("click", function () {
      expenses = expenses.filter(function (e) {
        return e.id !== item.id;
      });
      saveExpenses(expenses);
      render();
    });

    li.appendChild(info);
    li.appendChild(amount);
    li.appendChild(deleteBtn);
    return li;
  }

  function validate(amountRaw, category, date) {
    var amount = parseFloat(amountRaw);
    if (amountRaw === "" || isNaN(amount)) {
      return "Введите сумму расхода.";
    }
    if (amount <= 0) {
      return "Сумма должна быть положительным числом.";
    }
    if (!category) {
      return "Выберите категорию.";
    }
    if (!date) {
      return "Укажите дату расхода.";
    }
    return null;
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    clearError();

    var amountRaw = amountInput.value;
    var category = categoryInput.value;
    var date = dateInput.value;
    var description = descriptionInput.value.trim();

    var error = validate(amountRaw, category, date);
    if (error) {
      showError(error);
      return;
    }

    var newExpense = {
      id: generateId(),
      amount: Math.round(parseFloat(amountRaw) * 100) / 100,
      category: category,
      date: date,
      description: description
    };

    expenses.push(newExpense);
    saveExpenses(expenses);

    form.reset();
    monthInput.value = date.slice(0, 7);
    render();
  });

  monthInput.addEventListener("change", render);

  monthInput.value = todayMonth();
  dateInput.value = new Date().toISOString().slice(0, 10);
  render();
})();
