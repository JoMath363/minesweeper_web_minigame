const 
    main = document.getElementById('main'),
    grid = document.getElementById('mine_grid'),
    flag_display = document.getElementById('flag_counter'),
    time_display = document.getElementById('time_counter'),
    result_icon = document.getElementById('result_icon'),
    difficulty_select = document.getElementById('difficulty_select');
    
let minefield = null;

class Minefield {
    constructor(mines, width, height) {
        this.width = width;
        this.height = height;

        this.mines = mines;
        this.flag_count = mines;
        this.time = 0;

        this.goal_pts = width * height - mines;
        this.pts = 0;

        this.field = this.get_field();
    }

    start(){
        let {width, height} = this

        grid.innerHTML = ''
        flag_display.innerHTML = String(this.flag_count).padStart(3, '0')
    
        grid.addEventListener('contextmenu', (e) => e.preventDefault()) 

        for (let i = 0; i < width * height; i++){
            let newItem = this.get_new_item(i)
            this.add_interactions(newItem)
            grid.appendChild(newItem)
        }

        this.start_timer()
    }

    end(result){
        let all_items = grid.getElementsByClassName('grid-item');

        for (let each of all_items){
            each.classList.add('clean')
            each.replaceWith(each.cloneNode(true))
        } 

        let icon = result == 'loss'? 'loss-icon' : 'win-icon';
        result_icon.src = `../img/${icon}.png`;
        flag_display.innerHTML = '000';

        this.stop_timer();
    }

    get_new_item(i){
        let field = this.field.flat();
        
        let new_item = document.createElement('div');
            new_item.classList.add('grid-item');
            new_item.setAttribute('value', field[i]);

            if (field[i] == '*'){
                new_item.innerHTML =
                '<img class="flag" draggable="false" src="img/flag-icon.png">' +
                '<img class="bomb" draggable="false" src="img/bomb-icon.png">'
            } else {
                let colorList = ['blue', 'green', 'red', 'darkblue', 'darkred', 'darkcyan', 'black', 'gray'],
                    n = field[i] == '0' ? '' : field[i]

                new_item.innerHTML += 
                '<img class="flag" draggable="false" src="img/flag-icon.png">' +
                `<span class="number" style="color: ${colorList[n-1]}">${n}</span>` 
            }
        
        return new_item
    }

    add_interactions(item){
        let flag = item.getElementsByClassName('flag')[0];

        item.addEventListener('contextmenu', (e) => {
            e.preventDefault()

            if (this.flag_count > 0) flag.classList.toggle('flagged');
            
            this.att_flag_counter(flag)
        })

        item.addEventListener('click', () => {
            let value = item.getAttribute('value')

            if (!flag.classList.contains('flagged')){
                switch (value){
                    case '*':
                        this.end('loss')
                        break;
                    case '0':
                        this.spread_clean(item)
                        break;
                    default:
                        item.classList.add('clean')
                        item.replaceWith(item.cloneNode(true))
                        this.pts++
                        break;
                }

                if (this.pts == this.goal_pts) this.end('win')
            }
        })
    }
    
    spread_clean(item) {
        let all_items = grid.getElementsByClassName('grid-item'),
            items_field = [];
    
        for (let i = 0; i < this.height; i++) {
            let row = []
            for (let j = 0; j < this.width; j++) {
                row.push(all_items[i * this.width + j])
            }
            items_field.push(row);
        }
    
        let row = 0, col = 0;
    
        for (let i = 0; i < all_items.length; i++) {
            if (all_items[i] == item) {
                row = Math.floor(i / this.width);
                col = i % this.width;
                break;
            }
        }
    
        this.recursive_spread(row, col, items_field)
    }
    
    recursive_spread(row, col, items_field) {
        let item = items_field[row]?.[col];
    
        if (!item || item.classList.contains('clean')) return
    
        item.classList.add('clean')
        item.replaceWith(item.cloneNode(true))
        this.pts++

        if (item.getAttribute('value') != '0') return;
    
        // top, bottom, left, right
        this.recursive_spread(row - 1, col, items_field);  
        this.recursive_spread(row + 1, col, items_field);  
        this.recursive_spread(row, col - 1, items_field);  
        this.recursive_spread(row, col + 1, items_field);  

        // top-left, top-right, bottom-left - bottom-right
        this.recursive_spread(row - 1, col - 1, items_field); 
        this.recursive_spread(row - 1, col + 1, items_field); 
        this.recursive_spread(row + 1, col - 1, items_field); 
        this.recursive_spread(row + 1, col + 1, items_field);
    }

    att_flag_counter(flag){
        if (flag.classList.contains('flagged')){
            if (this.flag_count == 0) {
                flag.classList.toggle('flagged')
                this.flag_count++
            } else {
                this.flag_count--
            }
        } else {
            if (this.flag_count > 0) this.flag_count++
        }
        
        flag_display.innerHTML = String(this.flag_count).padStart(3, '0')
    }

    start_timer(){
        this.timer = setInterval(() => {
            this.time++

            time_display.innerHTML = String(this.time).padStart(3, '0')
        }, 1000)
    }

    stop_timer(){
        clearInterval(this.timer)
    }

    get_field(){
        let {mines, width, height} = this,
            field = Array.from({length: height}, () => Array.from({length: width}).fill(' ')),
            count = 0
    
        while (count < mines){
            let row = Math.floor(Math.random() * (height-1)),
                col = Math.floor(Math.random() * (width-1))
    
            if (field[row][col] != '*'){
                field[row][col] = '*'
                count++
            }
        }
    
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                if (field[i][j] == '*') continue
    
                let around = []
    
                for (let k = i-1; k < i+2; k++){
                    if (field[k] != undefined) {
                        around.push(field[k].slice(Math.max(j-1, 0), j+2))
                    }
                }
    
                field[i][j] = String(around.flat().filter(x => x == '*').length)
            }   
        }

        return field
    }
}

function start_game(){
    let difficulty = difficulty_select.value;

    if (minefield != null){
        minefield.end()
        Storage.minefield = null 
    }
    
    result_icon.src = 'img/default-icon.png'
    time_display.innerHTML = '000'
    main.style.display = 'flex'

    switch (difficulty){
        case 'Easy':
            main.style.width = '450px'
            grid.style.gridTemplateColumns = `repeat(9, 1fr)`
            grid.style.gridTemplateRows = `repeat(9, 1fr)`
            minefield = new Minefield(10, 9, 9)
            break;
        case 'Normal':
            main.style.width = '750px'
            grid.style.gridTemplateColumns = `repeat(16, 1fr)`
            minefield = new Minefield(30, 16, 9)
            break;
        case 'Hard':
            main.style.width = '1100px'
            grid.style.gridTemplateColumns = `repeat(23, 1fr)`
            minefield = new Minefield(59, 23, 9)
            break;
    }

    minefield.start()
}