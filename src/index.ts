import { Juris, JurisComponentFunction, JurisContext } from "juris";
import { HeadlessManager } from 'juris/juris-headless';
import { AppState, initialState, Todo } from "./state";

class ApiClient {
  getTodos(): Promise<Todo[]> {
    // Simulate an API call
    return new Promise((resolve) => {
      console.log("ApiClient: Fetching todos...");
      setTimeout(() => {
        resolve([
          Object.freeze({ id: "1", title: "Learn Juris", done: false }),
          Object.freeze({ id: "2", title: "Build a Todo App", done: false }),
        ]);
      }, 1000);
    });
  }
}


const services = {
  apiClient: new ApiClient()
};
type AppServices = typeof services;

const DataManager = (_props: { boy: number }, context: JurisContext<AppState, AppServices>) => {
  let todosById: Record<string, Todo> = {};

  const getTodos = () => context.getState("todos", []);

  return {
    api: {
      todosById,
      todos: getTodos,
      nextId: () => (Object.keys(todosById).length + 1).toString(),
      fetchTodos: async () => {
        console.log("DataManager: Fetching todos...");
        const todos = await context.apiClient.getTodos();
        context.setState("todos", Object.freeze(todos));

        for (const todo of todos) {
          todosById[todo.id] = todo;
        }
        console.log("DataManager: Todos fetched and state updated.");
        return todos;
      },
      getTodoById: (id: string) => {
        return todosById[id];
      },
      addTodo: (todo: Todo) => {
        todosById[todo.id] = todo;
        const currentTodos = getTodos();
        context.setState("todos", [...currentTodos, todo]);
      },
      toggleTodo: (id: string) => {
        const todo = todosById[id];
        console.log("DataManager: Toggling todo with id:", { todo, id });
        if (todo) {
          todosById[id] = {
            ...todo,
            done: !todo.done,
          };
          context.setState("todos", [...Object.values(todosById)]);
        }
      }
    }
  }
};

const DataLogger = (_props: Record<string, any>, _context: JurisContext<AppState, AppServices>) => {
  return {
    hooks: {
      onRegister: () => {
        console.log("DataLogger registered");
      }
    }
  };
};


const headlessComponents = {
  DataManager: { fn: DataManager, options: { autoInit: true } },
  DataLogger: { fn: DataLogger, options: { autoInit: true } },
};
type AppHeadlessComponents = typeof headlessComponents;

const DataComponent: JurisComponentFunction<AppState, AppServices, AppHeadlessComponents> = async (_props, context) => {

  const dataManagerApi = context.components?.getHeadlessAPI("DataManager");
  console.log("DataComponent: DataManager API:", dataManagerApi);
  if (!dataManagerApi) {
    throw new Error("DataManager API not available");
  }

  return {
    hooks: {
      onMount: async () => {
        console.log("DataComponent mounted");
        dataManagerApi.fetchTodos();
      },
      onUpdate: (old, newProps) => {
        console.log("DataComponent updated", { old, newProps });
        const todos = dataManagerApi.todos();
        console.log("Current todos:", todos);
      }
    },
    render: () => ({
      div: {
        children: () => [
          ...dataManagerApi.todos().map(todo => ({
            div: {

              children: () => [
                {
                  div: {
                    style: () => ({ textDecoration: todo.done ? 'line-through' : 'none' }),
                    text: () => `${todo.id}: ${todo.title}`,
                  }
                },
                {
                  button: {
                    text: () => todo.done ? 'Mark Undone' : 'Mark Done',
                    onclick: () => dataManagerApi.toggleTodo(todo.id),
                  }
                },
              ]
            },
          })),
          {
            input: {
              type: 'text',
              placeholder: 'New todo title',
              id: 'new-todo-title',
            }
          },
          {
            button: {
              text: () => 'Add Todo',
              onclick: () => {
                const input = document.getElementById('new-todo-title') as HTMLInputElement;
                const title = input.value.trim();
                if (title) {
                  const id = dataManagerApi.todos().length + 1;
                  const newTodo: Todo = Object.freeze({
                    id: dataManagerApi.nextId(),
                    title,
                    done: false,
                  });
                  dataManagerApi.addTodo(newTodo);
                  input.value = '';
                }
              }
            }
          }
        ],

        className: 'data-component',
      }
    }),
  };
};


/** ---- Create Juris app ---- */
export const app = new Juris({
  states: initialState,
  services,
  components: {
    DataComponent,
  },
  layout: { DataComponent: {} },
  headlessComponents: {
    DataManager: { fn: DataManager, options: { autoInit: true } },
    DataLogger: { fn: DataLogger, options: { autoInit: true } },
  },
  features: {
    headless: HeadlessManager,
  }
});
app.render('#app');

const todos = app.getState("todos", []);
console.log("Todos:", todos);
const counter = app.getState("counter", 0);
console.log("Counter:", counter);
const filter = app.getState("filter", "all");
console.log("Filter:", filter);
const theme = app.getState("settings.theme");
console.log("Theme:", theme);
app.setState("settings.theme", "dark");
console.log("Updated Theme:", app.getState("settings.theme"));
const context = app.createContext();
context.apiClient.getTodos();
const dataManager = app.getHeadlessComponent("DataManager");
console.log("DataManager API:", dataManager?.api);
dataManager.api.fetchTodos();
app.registerComponent("AnotherDataComponent", DataComponent);