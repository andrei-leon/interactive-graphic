import makeGraph from './Graph.js'

export default function () {
    //Задать значения текущей даты и даты 5 лет назад в формате yyyy-mm-d/dd.
    const years = 5
    const today = `${new Date().getFullYear()}-${Number.parseInt(new Date().getMonth()+1)}-${new Date().getDate()}`;
    const firstDay = `${new Date().getFullYear()-years}-${Number.parseInt(new Date().getMonth() + 1)}-${new Date().getDate()}`;

    //Принятие данных апи в указанных выше промежутках
    const baseCurrency = 'GBP'
    const secondCurrency = 'USD'
    const url = `https://api.exchangeratesapi.io/history?base=${baseCurrency}&symbols=${secondCurrency}&start_at=${firstDay}&end_at=${today}`;
    const data = [];
    const fetchData = fetch(url);

    //Загрузка массива с данными
    fetchData.then(response => response.json())
        .then(quotations => {
            //Сохранение нужных данных в массив
            for (const key in quotations.rates) {
                data.push({
                    date: key,
                    value: quotations.rates[key].USD
                })
            }

            //Сортировка массива по дате.
            data.sort((a, b) => a.date.split("-").join("") - b.date.split("-").join(""));

            const database = transformData(data);

            //! Ф-ция, выстраивающая оси на графике
            makeGraph(database);
        })
    //! Дописать кетч
};

/*Принцип работы такой: сравниваются два числа, если второе начинается на новой неделе, то в массив добавляется объект с последней датой прошлой недели, а также среднее арифметическое коэффициента отношения валют за неделю. 
Это нужно для того, чтобы узнать в какой день недели заканчивается биржевая неделя, чтобы потом по этим точка строить график.*/

const transformData = (arr) => {
    const transformed = [];
    let counter = 0;
    let value = 0;

    arr.reduce((prev, current) => {
        counter++;
        value = value + prev.value;

        //Если дата является сегодняшней
        if (current == arr[arr.length - 1]) {
            //Увеличивает значение. Необходимо прибавить коэффициент за сегодня
            counter++;
            value = value + current.value;

            transformed.push({
                date: current.date,
                value: value / counter
            });

            return;
        }

        //Если дата является последней в биржевой неделе
        if (compareDate(prev.date, current.date)) {

            transformed.push({
                date: prev.date,
                value: value / counter
            });

            //общая сумма и делитель для подсчитывания среднего арифметического у коэффициента валюты
            value = 0;
            counter = 0;
        }

        return prev = current;
    });

    return transformed
}

//Сравнение дат, чтобы узнать в какой день заканчивается биржевая неделя. Проверяется по сравнению дня недели.
const compareDate = (prev, current) => {
    const date = new Date(current);
    const prevDate = new Date(prev);

    return date.getDay() < prevDate.getDay();
}