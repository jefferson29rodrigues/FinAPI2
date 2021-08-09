const { response, request } = require('express');
const express = require('express');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(express.json());

const customers = [];

// Middleware

function verifyIfExistsAccountCPF(request, response, next) {
    const { cpf } = request.headers;

    const customer = customers.find((um) => um.cpf === cpf);
    
    if (!customer) {
        return response.status(400).json({ error: 'Customer NOT FOUND!'});
    }

    request.customer = customer;

    return next();
}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if (operation.type === 'credit') {
            return acc + operation.amount;
        } else {
            return acc - operation.amount;
        }
    }, 0);

    return balance;
}

/**
 * cpf - string
 * name - string
 * id - uuid
 * statement []
*/
app.post('/account', (request, response) => {
    const { cpf, name } = request.body;

    const customerAlreadyExists = customers.some((um) => um.cpf === cpf)

    if (customerAlreadyExists) {
        return response.status(400).json({ error: 'Customer already exists!' });
    }

    customers.push({
        name,
        cpf,
        id: uuidv4(),
        statement: []
    });

    return response.status(201).json(customers);
})

//app.use(verifyIfExistsAccountCPF)

app.get('/statement', verifyIfExistsAccountCPF, (request, response) => {
    const { customer } = request

    return response.json(customer.statement);
})

app.post('/deposit', verifyIfExistsAccountCPF, (request, response) => {
    const { description, amount } = request.body;

    const { customer } = request;

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation);

    return response.status(201).json(customer);
})

app.post('/withdraw', verifyIfExistsAccountCPF, (request, response) => {
    const { amount } = request.body;
    const { customer } = request;

    const balance = getBalance(customer.statement);

    if (balance < amount) {
        return response.status(400).json({error: 'Insufficient funds!'})
    }

    const statementOperation = {
        amount,
        create_at: new Date(),
        type: "Debit",
    };

    customer.statement.push(statementOperation);

    return response.status(201).json(customer);
})

app.listen(3333, console.log('Servidor Rodando!!!'))