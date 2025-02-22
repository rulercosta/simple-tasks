class TodoList {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('tasks')) || [];
        this.taskInput = document.getElementById('taskInput');
        this.taskList = document.getElementById('taskList');
        this.taskCount = document.getElementById('taskCount');
        
        this.modal = document.getElementById('modal');
        this.modalOverlay = document.getElementById('modalOverlay');
        this.addButton = document.getElementById('addButton');
        this.modalClose = document.getElementById('modalClose');
        this.modalSubmit = document.getElementById('modalSubmit');
        
        this.isEditing = false;
        this.editingTaskId = null;
        
        this.themeToggle = document.getElementById('themeToggle');
        this.initTheme();
        
        this.searchInput = document.getElementById('searchInput');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        
        this.currentFilter = 'all';
        this.searchQuery = '';
        
        this.init();
        this.initModal();
        this.initFilters();
        this.initSearch();
        this.updateTaskCount();
        
        this.setupPullToRefresh();
        this.setupHaptics();
        this.setupSwipeToDelete();
    }

    initTheme() {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        
        document.body.classList.toggle('dark-mode', darkMode);
        this.themeToggle.setAttribute('aria-checked', darkMode);
        
        this.themeToggle.addEventListener('click', () => {
            const isDarkMode = !document.body.classList.contains('dark-mode');
            document.body.classList.toggle('dark-mode', isDarkMode);
            localStorage.setItem('darkMode', isDarkMode);
            this.themeToggle.setAttribute('aria-checked', isDarkMode);
        });
    }

    init() {
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.taskInput.value.trim()) {
                this.addTask(this.taskInput.value.trim());
                this.taskInput.value = '';
                this.closeModal();
            }
        });

        this.renderTasks();
    }

    initModal() {
        this.addButton.addEventListener('click', () => this.openModal());
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', (e) => {
            if (e.target === this.modalOverlay) this.closeModal();
        });
        
        this.modalSubmit.addEventListener('click', () => this.handleSubmit());

        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.taskInput.value.trim()) {
                this.handleSubmit();
            }
        });
    }

    initFilters() {
        this.sectionHeader = document.querySelector('.section-header');
        
        this.filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentFilter = btn.dataset.filter;
                this.filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                this.sectionHeader.textContent = {
                    'all': 'My Tasks',
                    'active': 'Active Tasks',
                    'completed': 'Completed Tasks'
                }[this.currentFilter];
                
                this.clearCompletedBtn.style.display = 
                    this.currentFilter === 'completed' && 
                    this.tasks.some(task => task.completed) 
                        ? 'block' 
                        : 'none';
                
                this.renderTasks();
            });
        });

        this.clearCompletedBtn.addEventListener('click', () => {
            const overlay = document.getElementById('confirmDialogOverlay');
            const cancelBtn = document.getElementById('confirmDialogCancel');
            const confirmBtn = document.getElementById('confirmDialogConfirm');

            const closeDialog = () => {
                overlay.classList.remove('active');
                cancelBtn.removeEventListener('click', handleCancel);
                confirmBtn.removeEventListener('click', handleConfirm);
            };

            const handleCancel = () => {
                closeDialog();
            };

            const handleConfirm = () => {
                this.tasks = this.tasks.filter(task => !task.completed);
                this.saveTasks();
                this.renderTasks();
                this.clearCompletedBtn.style.display = 'none';
                this.triggerHapticFeedback('medium');
                closeDialog();
            };

            cancelBtn.addEventListener('click', handleCancel);
            confirmBtn.addEventListener('click', handleConfirm);
            overlay.classList.add('active');
        });
    }

    initSearch() {
        this.searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderTasks();
        });
    }

    openModal(taskId = null) {
        this.isEditing = taskId !== null;
        this.editingTaskId = taskId;
        
        const modalTitle = document.querySelector('.modal-title');
        
        if (this.isEditing) {
            const task = this.tasks.find(t => t.id === taskId);
            this.taskInput.value = task.text;
            this.modalSubmit.textContent = 'Save Changes';
            modalTitle.textContent = 'Edit Task';
        } else {
            this.modalSubmit.textContent = 'Add Task';
            modalTitle.textContent = 'New Task';
        }
        
        this.modalOverlay.classList.add('active');
        this.modal.classList.add('active');
        this.taskInput.focus();
    }

    closeModal() {
        this.modalOverlay.classList.remove('active');
        this.modal.classList.remove('active');
        this.taskInput.value = '';
    }

    handleSubmit() {
        const text = this.taskInput.value.trim();
        if (!text) return;

        if (this.isEditing) {
            this.updateTask(this.editingTaskId, text);
        } else {
            this.addTask(text);
        }
        
        this.closeModal();
    }

    addTask(text) {
        const task = {
            id: Date.now(),
            text,
            completed: false
        };

        this.tasks.push(task);
        this.saveTasks();
        this.renderTasks();
        this.updateTaskCount();
    }

    updateTask(id, newText) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.text = newText;
            this.saveTasks();
            this.renderTasks();
        }
    }

    toggleTask(id) {
        const task = this.tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
        }
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(t => t.id !== id);
        this.saveTasks();
        this.renderTasks(); 
        this.updateTaskCount();
    }

    getFilteredTasks() {
        let filtered = [...this.tasks];
        
        if (this.searchQuery) {
            filtered = filtered.filter(task => 
                task.text.toLowerCase().includes(this.searchQuery)
            );
        }
        
        switch (this.currentFilter) {
            case 'active':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
        }
        
        return filtered;
    }

    renderTask(task) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-item';
        taskElement.id = `task-${task.id}`;
        taskElement.setAttribute('data-task-id', task.id);
        
        taskElement.innerHTML = `
            <div class="task-checkbox ${task.completed ? 'checked' : ''}"
                 role="checkbox"
                 aria-checked="${task.completed}"
                 tabindex="0"
                 onclick="todoList.toggleTask(${task.id}); this.classList.toggle('checked'); this.nextElementSibling.classList.toggle('completed')">
            </div>
            <div class="task-text ${task.completed ? 'completed' : ''}"
                 ondblclick="todoList.openModal(${task.id})">${task.text}</div>
            <button class="delete-btn" 
                    aria-label="Delete task"
                    onclick="todoList.deleteTask(${task.id})">
                Delete
            </button>
        `;

        this.taskList.appendChild(taskElement);
    }

    renderTasks() {
        this.taskList.innerHTML = '';
        const filteredTasks = this.getFilteredTasks();
        const emptyState = document.getElementById('emptyState');
        const taskListElement = document.getElementById('taskList');
        
        if (filteredTasks.length === 0) {
            emptyState.style.display = 'flex';
            taskListElement.style.display = 'none';
        } else {
            emptyState.style.display = 'none';
            taskListElement.style.display = 'block';
            filteredTasks.forEach(task => this.renderTask(task));
        }
        
        const count = filteredTasks.length;
        this.taskCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
        
        if (this.currentFilter === 'completed') {
            this.clearCompletedBtn.style.display = 
                this.tasks.some(task => task.completed) ? 'block' : 'none';
        }
    }

    saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(this.tasks));
    }

    updateTaskCount() {
        const count = this.tasks.length;
        this.taskCount.textContent = `${count} ${count === 1 ? 'task' : 'tasks'}`;
    }

    setupPullToRefresh() {
        let startY = 0;
        let pulling = false;
        const pullIndicator = document.createElement('div');
        pullIndicator.className = 'pull-indicator';
        pullIndicator.textContent = 'Pull to refresh';
        this.taskList.parentNode.insertBefore(pullIndicator, this.taskList);

        this.taskList.addEventListener('touchstart', (e) => {
            if (this.taskList.scrollTop === 0) {
                startY = e.touches[0].pageY;
                pulling = true;
            }
        });

        this.taskList.addEventListener('touchmove', (e) => {
            if (!pulling) return;
            
            const y = e.touches[0].pageY;
            const pull = y - startY;
            
            if (pull > 0) {
                pullIndicator.style.height = Math.min(pull, 50) + 'px';
                if (pull > 50) {
                    pullIndicator.textContent = 'Release to refresh';
                }
            }
        });

        this.taskList.addEventListener('touchend', () => {
            if (pulling && pullIndicator.offsetHeight >= 50) {
                this.refreshTasks();
                this.triggerHapticFeedback('medium');
            }
            pulling = false;
            pullIndicator.style.height = '0';
            pullIndicator.textContent = 'Pull to refresh';
        });
    }

    setupHaptics() {
        if ('vibrate' in navigator) {
            this.taskList.addEventListener('click', (e) => {
                if (e.target.classList.contains('task-checkbox')) {
                    this.triggerHapticFeedback('light');
                } else if (e.target.classList.contains('delete-btn')) {
                    this.triggerHapticFeedback('heavy');
                }
            });
        }
    }

    triggerHapticFeedback(intensity) {
        if (!('vibrate' in navigator)) return;
        
        switch (intensity) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'heavy':
                navigator.vibrate([30, 10, 30]);
                break;
        }
    }

    refreshTasks() {
        const pullIndicator = document.querySelector('.pull-indicator');
        pullIndicator.textContent = 'Refreshing...';
        
        setTimeout(() => {
            this.renderTasks();
            pullIndicator.style.height = '0';
            pullIndicator.textContent = 'Pull to refresh';
        }, 1000);
    }

    setupSwipeToDelete() {
        let touchStartX = 0;
        let touchStartY = 0;
        let currentTask = null;
        let isScrolling = null;
        const threshold = -50;
        const scrollThreshold = 5; 
        
        const resetSwipe = (taskElement) => {
            if (taskElement) {
                taskElement.style.transition = 'transform 0.3s ease';
                taskElement.style.transform = 'translateX(0)';
            }
        };

        this.taskList.addEventListener('touchstart', (e) => {
            const taskElement = e.target.closest('.task-item');
            if (!taskElement) return;

            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            currentTask = taskElement;
            isScrolling = null;
            currentTask.style.transition = 'none';
        }, { passive: true });

        this.taskList.addEventListener('touchmove', (e) => {
            if (!currentTask) return;

            const currentX = e.touches[0].clientX;
            const currentY = e.touches[0].clientY;
            const deltaX = currentX - touchStartX;
            const deltaY = currentY - touchStartY;

            if (isScrolling === null) {
                isScrolling = Math.abs(deltaY) > Math.abs(deltaX);
            }

            if (isScrolling) {
                resetSwipe(currentTask);
                return;
            }

            if (Math.abs(deltaX) > scrollThreshold && !isScrolling) {
                e.preventDefault(); 
                
                if (deltaX < 0) {
                    currentTask.style.transform = `translateX(${deltaX}px)`;
                }
            }
        }, { passive: false });

        this.taskList.addEventListener('touchend', (e) => {
            if (!currentTask) return;

            if (!isScrolling) {
                const touchEndX = e.changedTouches[0].clientX;
                const swipeDistance = touchEndX - touchStartX;

                if (swipeDistance < threshold) {
                    currentTask.style.transition = 'transform 0.3s ease';
                    currentTask.style.transform = 'translateX(-100%)';
                    this.triggerHapticFeedback('medium');
                    
                    const taskId = parseInt(currentTask.getAttribute('data-task-id'));
                    setTimeout(() => this.deleteTask(taskId), 300);
                } else {
                    resetSwipe(currentTask);
                }
            }

            currentTask = null;
            isScrolling = null;
        });

        ['touchcancel', 'touchleave'].forEach(eventName => {
            this.taskList.addEventListener(eventName, () => {
                resetSwipe(currentTask);
                currentTask = null;
                isScrolling = null;
            });
        });
    }
}

const todoList = new TodoList(); 

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/static/sw.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful');
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}