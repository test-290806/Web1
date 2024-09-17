let tableData = [];
window.addEventListener("load", loadTableData);
//Подобие enum для обработки исключений и вывода сообщений
const message_type = Object.freeze({
    OK: 1,
    EMPTY_FIELDS: 2,
    R_NOT_DIGIT: 3,
    INVALID_R: 4,
    SOME_SERVER_ERROR: 5
})

//Имитация radio используя checkbox
const x_checkboxes = document.getElementsByName("x_checkbox_input");
let active_x_checkbox = null;
x_checkboxes.forEach(checkbox => {checkbox.addEventListener("change", () => {
    if(checkbox === active_x_checkbox){
        active_x_checkbox = null;
    }
    else{
        if(active_x_checkbox !== null) active_x_checkbox.checked = false;
        active_x_checkbox = checkbox;
    }
})})

//Функция отправки запроса на сервер и получения ответа
async function submitForm(event) {
    // Предотвращаем перезагрузку страницы
    event.preventDefault();

    //Извлекаем данные формы
    const formData = new FormData(event.target);
    const x = formData.get("x_checkbox_input");
    const y = formData.get("y_radio_input");
    const r = formData.get("r_text_input");

    //Проводим валидацию
    let result = validate_data(x, y, r);
    if(result !== message_type.OK){
        show_user_message(result);
        return;
    }

    //Выполняем запрос измеряя время
    const queryParams = new URLSearchParams();
    queryParams.append("X", x);
    queryParams.append("Y", y);
    queryParams.append("R", r);

    let responseData;
    try {
        let response = await fetch(`/fcgi-bin/server.jar?${queryParams.toString()}`);
        if(!response.ok){
            show_user_message(message_type.SOME_SERVER_ERROR);
            return;
        }
        responseData = await response.json();
    } catch (error){
        show_user_message(message_type.SOME_SERVER_ERROR);
        return;
    }

    //Записываем данные в историию
    let execution_time = responseData.executionTime;
    let hit = responseData.hit;
    add_data_to_history(x, y, r, hit, execution_time);
}

//Метод для показа сообшений пользователю
function show_user_message(message){
    switch (message){
        case message_type.EMPTY_FIELDS:
            alert("Пожалуйста заполните все поля!");
            break;
        case message_type.R_NOT_DIGIT:
            alert("Значение R должно быть числом!");
            break;
        case message_type.INVALID_R:
            alert("Значение R должно быть в пределах [-5; 5]!");
            break;
        case message_type.SOME_SERVER_ERROR:
            alert("Упс... Произошла ошибка при работе с сервером. Пожалуйста, повторите попытку позже.");
            break;
    }
}

//Функция валидации данных формы
function validate_data(x, y, r){
    if(x == null || y == null || r == null ||  r === "") return message_type.EMPTY_FIELDS;
    if(isNaN(r) || isNaN(parseFloat(r))) return message_type.R_NOT_DIGIT
    if(r < -5 || r > 5) return message_type.INVALID_R
    return message_type.OK;
}

//Функция добавления данных в таблицу
function add_data_to_history(x, y, r, hit, execution_time){
    let table_ref = document.querySelector("#history_table tbody");

    let newRow = table_ref.insertRow(-1);

    let xCell = newRow.insertCell(0);
    let yCell = newRow.insertCell(1);
    let rCell = newRow.insertCell(2);
    let hitCell = newRow.insertCell(3);
    let timeCell = newRow.insertCell(4);
    let executionTimeCell = newRow.insertCell(5);

    let xText = document.createTextNode(x.toString());
    let yText = document.createTextNode(y.toString());
    let rText = document.createTextNode(Number(r).toFixed(2).toString());
    let hitText = document.createTextNode(hit.toString());
    let timeText = document.createTextNode(new Date().toLocaleTimeString());
    let executionTimeText = document.createTextNode(execution_time.toString());

    tableData.push([xText.textContent, yText.textContent, rText.textContent, hitText.textContent, timeText.textContent, executionTimeText.textContent]);
    sessionStorage.setItem("tableData", JSON.stringify(tableData));

    xCell.appendChild(xText);
    yCell.appendChild(yText);
    rCell.appendChild(rText);
    hitCell.appendChild(hitText);
    timeCell.appendChild(timeText);
    executionTimeCell.appendChild(executionTimeText);
}

// Функция для восстановления данных таблицы из sessionStorage
function loadTableData() {
    let savedData = sessionStorage.getItem("tableData");
    if (savedData) {
        tableData = JSON.parse(savedData);
        const table = document.querySelector("#history_table tbody");
        tableData.forEach(row => {
            let newRow = table.insertRow(-1);
            row.forEach(element => {
                let newCell = newRow.insertCell(-1);
                newCell.appendChild(document.createTextNode(element));
            });
        });
    }
}