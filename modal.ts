import { App, Modal, Setting } from "obsidian";


export class ExampleModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;
  
	constructor(app: App, onSubmit: (result: string) => void) {
	  super(app);
	  this.onSubmit = onSubmit;
	}
  
	onOpen() {
	  const { contentEl } = this;
  
	  contentEl.createEl("h1", { text: "What's your name?" });
  
	  new Setting(contentEl)
		.setName("Name")
		.addText((text) =>
		  text.onChange((value) => {
			this.result = value
		  }));
  
	  new Setting(contentEl)
		.addButton((btn) =>
		  btn
			.setButtonText("Submit")
			.setCta()
			.onClick(() => {
			  this.close();
			  this.onSubmit(this.result);
			}));
	}
  
	onClose() {
	  let { contentEl } = this;
	  contentEl.empty();
	}
  }
  

// import {Plugin} from 'obsidian'

// export default class ExamplePlugin extends Plugin {
// 	statusBarTextElement: HTMLSpanElement

// 	onload() {
// 		this.statusBarTextElement = this.addStatusBarItem().createEl('span');
// 		this.statusBarTextElement.textContent = "hello";

// 		this.app.workspace.on('active-leaf-change', async () => {
// 			const file = this.app.workspace.getActiveFile();
// 			if (file) {
// 				const content = await this.app.vault.read(file);
// 				console.log(content);
// 				this.updateLineCount(content);
// 			} else {
// 				this.updateLineCount(undefined)
// 			}
// 		})

// 		this.app.workspace.on('editor-change', editor => {
// 			const content = editor.getDoc().getValue();
// 			this.updateLineCount(content);
// 		})
// 	}

// 	private updateLineCount(fileContent?: string) {
// 		const count = fileContent ? fileContent.split(/\r\n|\r|\n/).length : 0;
// 		const linesWord = count === 1 ? "line" : "lines"; 
// 		this.statusBarTextElement.textContent = `${count} ${linesWord}` ;
// 	}

// }