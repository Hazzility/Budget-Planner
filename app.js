//create module to ensure data privacy
//budget module
//back end
var budgetController = (function() {
    var Expense = function(id, description, value) {
        this.id = id
        this.description = description
        this.value = value
        this.percentage = -1
    }

    Expense.prototype.calcPerc = function(ttlInc) {
        if (ttlInc > 0) {
            this.percentage = Math.round(this.value / ttlInc * 100)
        } else {
            this.percentage = -1
        }
    }

    Expense.prototype.getPerc = function() {
        return this.percentage
    }

    var Income = function(id, description, value) {
        this.id = id
        this.description = description
        this.value = value
    }

    var storeData = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    }

    var calculateTotal = function(type) {
        var sum = 0
        storeData.allItems[type].forEach(function(cur) {
            sum += cur.value
        })
        storeData.totals[type] = sum
    }
    return {
        addItem: function(type, description, value) {
            var newItem, ID
            //generate a new ID
            if (storeData.allItems[type].length > 0) {
                ID = storeData.allItems[type][storeData.allItems[type].length - 1].id + 1
            } else {
                ID = 0
            }
            //generate new item
            if (type === 'exp') {
                newItem = new Expense(ID, description, value)
            } else if (type === 'inc') {
                newItem = new Income(ID, description, value)
            }
            
            storeData.allItems[type].push(newItem)
            return newItem
        },

        calculateBudget: function() {
            //calculate total income and expenses and the final budget
            calculateTotal('inc')
            calculateTotal('exp')
            storeData.budget = storeData.totals.inc - storeData.totals.exp
            //calculate the percentage of income spent
            if (storeData.totals.inc > 0) {
                storeData.percentage = Math.round(storeData.totals.exp / storeData.totals.inc * 100)
            } else {
                storeData.percentage = -1
            }
            
        },
 
        calculatePerc: function() {
            storeData.allItems.exp.forEach(function(curr) {
                curr.calcPerc(storeData.totals.inc)
            })
        },

        getPerc: function() {
            var percs = storeData.allItems.exp.map(function(curr) {
                return curr.getPerc()
            })
            return percs
        },

        getBudget: function(){
            return {
                budget: storeData.budget,
                perc: storeData.percentage,
                ttlInc: storeData.totals.inc,
                ttlExp: storeData.totals.exp
            }
        },

        deleteItem: function(type, ID) {
            //find the index of ID
            var IDs = storeData.allItems[type].map(function(curr) {
                return curr.id
            })
            var index = IDs.indexOf(ID)

            if (index !== -1) {
                storeData.allItems[type].splice(index, 1)
            }
        }
    }
})()

//UI module
//front end
var UIController = (function() {
    var DOMstrings = {
        type: '.add__type',
        description: '.add__description',
        inputValue: '.add__value',
        btn: '.add__btn',
        incomeContainer: '.income__list',
        expenseContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percLabel: '.budget__expenses--percentage',
        container: '.container',
        expensePerc: '.item__percentage',
        date: '.budget__title--month'
    }

    var formatNumber = function(num, type) {
        num = Math.abs(num)
        num = num.toFixed(2)
        var numSplit = num.split('.')

        var int = numSplit[0]
        var dec = numSplit[1]

        var frontSub
        if (int.length > 3) {
            frontSub = int.substr(0, int.length - 3)
            int = ',' + int.substr(int.length - 3, 3)
            while (frontSub.length > 3) {
                int = ',' + frontSub.substr(frontSub.length - 3, 3) + int
                frontSub = frontSub.substr(0, frontSub.length - 3)
            }
            int = frontSub + int
        }
        
        var formatNumber
        if (type === 'exp') {
            formatNumber = '- ' + int + '.' + dec
        } else {
            formatNumber = '+ ' + int + '.' + dec
        }

        return formatNumber
    }


    var nodeListForEach = function(list, callBack) {
        for(var i = 0; i < list.length; i++) {
            callBack(list[i], i)
        }
    }

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.type).value, //either inc or exp
                description: document.querySelector(DOMstrings.description).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value)
            }
        },

        getDOMstrings: function() {
            return DOMstrings
        },

        addListItem: function(obj, type) {
            var HTML, newHtml, element
            //create HTML string with placeholder
            if (type === 'inc') {
                element = DOMstrings.incomeContainer
                HTML = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            } else if (type === 'exp') {
                element = DOMstrings.expenseContainer
                HTML = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">%percentage%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>'
            }
            
            //replace placeholder
            newHtml = HTML.replace('%id%', obj.id)
            newHtml = newHtml.replace('%description%', obj.description)
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type))
            //insert the HTML into the DOM
            document.querySelector(element).insertAdjacentHTML("beforeend", newHtml)
        },

        clearFields: function() {
            var fields, newArray
            fields = document.querySelectorAll(DOMstrings.description + ',' + DOMstrings.inputValue)
            //turn a list to an array
            newArray = Array.prototype.slice.call(fields)
            //empty each element
            newArray.forEach(function(curr) {
                curr.value = ''
            })
            newArray[0].focus()
        },

        displayBudget: function(obj) {

            var type 
            if (obj.budget >= 0) {
                type = 'inc'
            } else {
                type = 'exp'
            }
            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type)
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.ttlInc, 'inc')
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.ttlExp, 'exp')

            if (obj.perc > 0) {
                document.querySelector(DOMstrings.percLabel).textContent = obj.perc + '%'
            } else {
                document.querySelector(DOMstrings.percLabel).textContent = '---'
            }
        },

        deleteListItem: function(ID) {
            var child = document.getElementById(ID)
            child.parentNode.removeChild(child)
        },

        displayPerc: function(perc) {

            var fields = document.querySelectorAll(DOMstrings.expensePerc)

            nodeListForEach(fields, function(curr, index) {
                if (perc[index] > 0) {
                    curr.textContent = perc[index] + '%'
                } else {
                    curr.textContent = '---'
                }
            })
        },

        displayMonth: function() {
            var now = new Date()

            var year = now.getFullYear()
            var month = now.getMonth()

            var monthArray = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
            document.querySelector(DOMstrings.date).textContent = monthArray[month] + ' ' + year
        },

        changeType: function() {
            var fields = document.querySelectorAll(DOMstrings.type + ',' + DOMstrings.description + ',' + DOMstrings.inputValue)

            nodeListForEach(fields, function(curr) {
                curr.classList.toggle('red-focus')
            })
            document.querySelector(DOMstrings.btn).classList.toggle('red')
        }
    }
})()

//app module
//back end
var appController = (function(budget, UI) {

    var setupEventListener = function () {
        document.querySelector(UI.getDOMstrings().btn).addEventListener('click', addItem)

        document.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                addItem()
            }
        })

        document.querySelector(UI.getDOMstrings().container).addEventListener('click', deleteItem)

        document.querySelector(UI.getDOMstrings().type).addEventListener('change', UI.changeType)
    }


    var updateBudget = function() {
        //5. calculate the budget
         budget.calculateBudget()
         var budgetSum = budget.getBudget()
        //6. display the budget on the UI
        UI.displayBudget(budgetSum)
    }

    var updatePerc = function() {
        //calculate the percentage and read the percentage
        budget.calculatePerc()
        var allPercs = budget.getPerc()
        //display the percentage in the UI
        UI.displayPerc(allPercs)
    }

    var addItem = function() {
        //1. get the input
        var input = UI.getInput()
        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            //2. add new item to budget controller
            var newItem = budget.addItem(input.type, input.description, input.value)
            //3. add new item to the UI
            UI.addListItem(newItem, input.type)
            //4. clear the fields
            UI.clearFields()
            //update the budget
            updateBudget()

            updatePerc()
        }
    }

    var deleteItem = function(event) {
        var itemID = event.target.parentNode.parentNode.parentNode.parentNode.id
        if (itemID) {

            var splitID = itemID.split('-')
            var type = splitID[0]
            var ID = parseInt(splitID[1])

            budget.deleteItem(type, ID)
            UI.deleteListItem(itemID)
            updateBudget()
            updatePerc()
        }
    }
    return {
        init: function() {
            setupEventListener()
            UI.displayBudget({
                budget: 0,
                ttlExp: 0,
                ttlInc: 0,
                perc: 0
            })
            UI.displayMonth()
        }
    }
})(budgetController, UIController)

appController.init()