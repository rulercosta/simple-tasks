class Book {
    constructor(title, author, url) {
        this.title = title;
        this.author = author;
        this.url = url;
    }
}

class UI {
    static displayBooks() {
        const books = Store.getBooks();

        books.forEach((book) => UI.addBookToList(book));
    }

    static addBookToList(book) {
        const list = document.querySelector('#book-list');

        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.author}</td>
            <td><a href="${book.url}">Link</a></td>
            <td><button class="btn btn-danger btn-sm danger"><i class="icon fas fa-trash fa-fw delete"></i></button></td>
        `;

        list.appendChild(row);
    }

    static deleteBook(el) {
        if(el.classList.contains('delete')) {
            el.parentElement.parentElement.parentElement.remove();
        } else if(el.closest('.danger')) {
            el.parentElement.parentElement.remove();
        }
    }

    static showAlert(message, className) {
        const div = document.createElement('div');
        div.className = `alert alert-${className}`;
        div.appendChild(document.createTextNode(message));
        const conatiner = document.querySelector('.container');
        const form = document.querySelector('#book-form');
        conatiner.insertBefore(div,form);
        setTimeout(() => document.querySelector('.alert').remove(),3000);
    }

    static clearFields() {
        document.querySelector('#title').value = '';
        document.querySelector('#author').value = '';
        document.querySelector('#url').value = '';
    }
}

class Store {
    static getBooks() {
        let books;
        if(localStorage.getItem('books') === null) {
            books = [];
        } else {
            books = JSON.parse(localStorage.getItem('books'));
        }

        return books;
    }

    static addBook(book) {
        const books = Store.getBooks();
        books.push(book);
        localStorage.setItem('books',JSON.stringify(books));
    }

    static removeBook(url) {
        const books = Store.getBooks();
        books.forEach((book,index) => {
            if(book.url === url) {
                books.splice(index,1);
            }
        });

        localStorage.setItem('books',JSON.stringify(books));
    }
}

document.addEventListener('DOMContentLoaded',UI.displayBooks);

document.querySelector('#book-form').addEventListener('submit',(e) => {
    e.preventDefault();

    const title = document.querySelector('#title').value;
    const author = document.querySelector('#author').value;
    const url = document.querySelector('#url').value;

    if(title === '' || author === '' || url === '') {
        UI.showAlert('Please Fill Fields!','danger');
    } else {
        const book = new Book(title,author,url);
        UI.addBookToList(book);
        Store.addBook(book);
        UI.showAlert('Book Added','success');
        UI.clearFields();
    }
});

document.querySelector('#book-list').addEventListener('click', (e) => {
    if (e.target.classList.contains('delete') || e.target.closest('.danger')) {
        const row = e.target.closest('tr');        
        const link = row.querySelector('a');
        const href = link ? link.getAttribute('href') : null;
        UI.deleteBook(e.target);
        Store.removeBook(href);
        UI.showAlert('Book Removed','info');
    }
});