import faker from 'faker';

let dashboardString = '';

for (let i = 0; i < 10; i++) {
  dashboardString += `<div>${faker.commerce.productName()}</div>`;
}

document.querySelector('#dashboard-list').innerHTML = dashboardString;