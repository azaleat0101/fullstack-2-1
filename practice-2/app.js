const express = require('express');
const app = express();
const port = 3000;

let goods = [
    {id: 1, name: "dress", price: 15000},
    {id: 2, name: "t-shirt", price: 5000},
    {id: 3, name: "hat", price: 2500},
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Главная страница');
});

// добавление товара
app.post('/goods', (req, res) => {
    const {name, price} = req.body;

    const newProduct = {
        id: Date.now(),
        name,
        price
    };

    goods.push(newProduct);
    res.status(201).json(newProduct);
});

// вывод всех товаров
app.get('/goods', (req, res) => {
    res.send(JSON.stringify(goods));
});

// вывод по отдельному id
app.get('/goods/:id', (req, res) => {
    let product = goods.find(u => u.id == req.params.id);
    res.send(JSON.stringify(product))
});

// редактирование
app.patch('/goods/:id', (req, res) => {
    const product = goods.find(u => u.id == req.params.id);
    const {name, price} = req.body;

    if (name != undefined) user.name = name;
    if (age != undefined) user.price = price;

    res.json(product)
});

app.delete('/goods/:id', (req, res) => {
    goods = goods.filter(u => u.id != req.params.id);
    res.send('ok');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});