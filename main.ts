import { addIcon, Menu, Notice, Plugin, Modal, WorkspaceLeaf, TFile, FileView } from "obsidian";
import { ExampleModal } from "./modal"
import { ExampleSettingTab } from "./settings";

interface ExamplePluginSettings {
	dateFormat: string;
}

const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
	dateFormat: "YYYY-MM-DD",
};


export default class ExamplePlugin extends Plugin {
  async onload() {

    await this.loadSettings();

    this.addSettingTab(new ExampleSettingTab(this.app, this));
	

	// new menu shortcut 

	
	// menu shortcut
    this.addRibbonIcon("star", "GameLyfe", () => {

		// new optimised flow 
		this.app.workspace.getLeaf(true).openFile(this.app.vault.getFileByPath('gamification/whoami.md'))

		// console.log("Initiate Game!");

		// const menu = new Menu();
		// menu.addItem((item) =>
		// 	item
		// 	  .setTitle("main")
		// 	  .onClick(() => {
		// 		this.app.workspace.getLeaf(true).openFile(this.app.vault.getFileByPath('gamification/whoami.md'))
		// 	  })
		//   );

		// menu.addItem((item) =>
		// 	item
		// 	  .setTitle("guild")
		// 	  .onClick(() => {
		// 		this.app.workspace.getMostRecentLeaf().openFile(this.app.vault.getFileByPath('gamification/guild.md'))
		// 	  })
		//   );

		// menu.addItem((item) =>
		// 	item
		// 	  .setTitle("store")
		// 	  .onClick(() => {
		// 		this.app.workspace.getMostRecentLeaf().openFile(this.app.vault.getFileByPath('gamification/store.md'))
		// 	  })
		//   );
  
		// menu.addItem((item) =>
		//   item
		// 	.setTitle("pop up window")
		// 	.onClick(() => {
		// 		new ExampleModal(this.app, (result) => {
		// 			new Notice(`Hello, ${result}!`);
		// 		  }).open();
			
		// 	})
		// );
		// menu.addItem((item) =>
		// 	item
		// 	  .setTitle("test")
		// 	  .onClick(() => {
		// 		new Notice("test");
		// 	  })
		//   );

		menu.showAtMouseEvent(event);

    });

	this.app.workspace.on('active-leaf-change', async () => {
		let filePath = this.app.workspace.getActiveFile()?.path;

		// monitoring file changes and apply changes to db 
		if (filePath?.startsWith("journal/daily")){

			let todayDate = this.parsePathToDate(filePath)
			console.log("YOU ARE IN DAILY NOTES" + todayDate)

			// Fetch current data from db, if no data is present create a new entry
			let cache = await this.fetchOrCreateDateEntry(todayDate)

			
//			this.app.workspace.on('file-open', async editor =>  {
			todayDate = this.parsePathToDate(filePath)
			const file = this.app.workspace.getActiveFile()
			const metadata = this.app.metadataCache.getFileCache(file)
			const frontmatter = metadata.frontmatter
			//console.log(frontmatter)

			let cur = new Array(frontmatter['fitness'], frontmatter['self-dev'], frontmatter['read'])

			for (let i = 0; i < cur.length; i++) {
				if (cur[i] !== cache[i+1]) {
					console.log('before editDateEntry : ',cur[i] , cache[i+1], todayDate, cur)
					this.editDateEntry(todayDate, cur)
					cache = cur
					break
				}
			}			
		
//			})
		}

		if (filePath?.startsWith("gamification/whoami")){
			console.log("YOU ARE IN CHARACTER PAGE")
			//TODO: remove hardcoding of basehp

			this.editHomePage()

		}
	})


  	}

  	private async editHomePage(){
		const file = this.app.vault.getAbstractFileByPath('gamification/whoami.md') as TFile;
		//TODO: put in source code of whoami.md file
        if (file) {
			// parsing the file
			const content = await this.app.vault.read(file);
			// const allData = content?.split(/\r\n|\r|\n/)
			const allData = content?.split('##')
 			let characterSegment = allData[1]
			let hpSegment = allData[2]
			let questSegment = allData[3]
			let shopSegment = allData[4]
			
			//edit HP entry
			let baseHP = 5
			let dailyFitnessArray = await this.readDbFile()
			let finalHP = this.computeHP(dailyFitnessArray ?? [], baseHP)

			let hpArr = hpSegment?.split(/\r\n|\r|\n/)
			let hpLine = hpArr[6]
			let hpLineArr = hpLine.split(/[\[\],]/)
			hpLineArr[1] = String(finalHP)
			hpLineArr[2] = String(baseHP - finalHP)
			let newHPLine = hpLineArr[0] + '[' + hpLineArr[1] + ',' + hpLineArr[2] + ']'
			let newHpArr = [...hpArr]
			newHpArr[6] = newHPLine
			let newHpSegment = newHpArr.join('\n')


			//edit quest segment 
			//retrieve current quest data 
			let questData = await this.readGuildFile()
			console.log(questData)

			// const newData = [...allData]
			// newData[7] = newHPLine
			// let newContent = newData.join('\n')
			// console.log('file writing...')
			// await this.app.vault.modify(file, newContent);
			// new Notice('Change recognised. File has been updated.');

			// Rejoin all 4 segments 
			let newAllData = allData[0] + '##' + characterSegment + '##' + newHpSegment + '##' +questSegment + '##' +shopSegment
			console.log('rewriting main file')
			await this.app.vault.modify(file, newAllData);
			new Notice('Change recognised. File has been updated.');

		}
	}

  	private computeHP(dailyFitnessArray: number[],baseHP: number): number {
		let curHP = baseHP
		for (let i = 0; i < dailyFitnessArray.length; i++) {
			if (dailyFitnessArray[i] == 1) {
				if (curHP !== baseHP) {
					curHP += 1
				}
			}
			else if (dailyFitnessArray[i] == 0){
				if (curHP !== 1) {
					curHP -= 1
				}
				else {
					new Notice("You are dead")
				}
			}
		}

		return curHP

	}

	private async readGuildFile() { 
		// read the file
		const file = this.app.vault.getAbstractFileByPath('gamification/Guild.md') as TFile;
		const GuildData: any[] = [];

        if (file) {
		  // parsing the file
          const content = await this.app.vault.read(file);
		  console.log("reading guild file.. ")
		  const allData = content?.split('##')
		  //searching for date entry
		  for (let i = 0; i < allData.length; i++) {
			// per story 
			let storyStr = allData[i]
			let storyArr = storyStr.split(/\r\n|\r|\n/)
			for (let j = 0; j < storyArr.length; j++){
				if (j==0){
					GuildData[i] = []
					GuildData[i].push(storyArr[j])
				}
				if (j>3){
					let questData = storyArr[j].split("|").map(element => element.trim())
					questData.shift()
					questData.pop()
					GuildData[i].push(questData)
				}
				if (storyArr[j].startsWith("\x3C")){
					GuildData[i].pop()
					break
				}
			}

		  }
		}
		GuildData.shift()
		return GuildData

	}

  	private async readDbFile() { 
		// read the file
		const file = this.app.vault.getAbstractFileByPath('gamification/db.md') as TFile;
		const dailyFitnessArray: number[] = [];

        if (file) {
		  // parsing the file
          const content = await this.app.vault.read(file);
		  const allData = content?.split(/\r\n|\r|\n/)
		  //searching for date entry
		  for (let i = 0; i < allData.length; i++) {
			const dayElements = allData[i].split(',');	
			dailyFitnessArray.push(+dayElements[1])
		  }
		  console.log(dailyFitnessArray)
		  return dailyFitnessArray
		}

	}

  	private parsePathToDate(filePath?: string){
		const arr = filePath? filePath.split(/[/.]/) : [];
		return arr[2];
	}

	private async editDateEntry(targetDate: string, newDateEntry: string[]){
		// read the file
		
		const file = this.app.vault.getAbstractFileByPath('gamification/db.md') as TFile;
        if (file) {
		  // parsing the file
          const content = await this.app.vault.read(file);
		  const allData = content?.split(/\r\n|\r|\n/)
		  //searching for date entry
		  for (let i = 0; i < allData.length; i++) {
			const dayElements = allData[i].split(',');
			console.log("comparing: ", dayElements[0], targetDate)
			if (dayElements[0] == targetDate) {
				newDateEntry.unshift(targetDate)
				let newDateEntryString = newDateEntry.join(',') + (',')
				//console.log(newDateEntryString)

				const newData = [...allData]
				newData[i] = newDateEntryString
				let newContent = newData.join('\n')
				console.log('file writing...')
				await this.app.vault.modify(file, newContent);
				new Notice('Change recognised. File has been updated.');
				break
			}
			
		  }
		}

	}
	private async fetchOrCreateDateEntry(targetDate?: string) {
		// TODO: Create an indexing feature (FUTURE)

		// read the file
		const file = this.app.vault.getAbstractFileByPath('gamification/db.md') as TFile;
        if (file) {
		  // parsing the file
          const content = await this.app.vault.read(file);
		  const allData = content?.split(/\r\n|\r|\n/)
		  //searching for date entry
		  for (let i = 0; i < allData.length; i++) {
			const dayElements = allData[i].split(',');		
			if (dayElements[0] == targetDate) {
				return dayElements
			}
		  }
		// if no entry found: create new entry
		  let newDate =  "\n" + targetDate + ",0,0,0,"
		  let newContent = content + newDate
		  await this.app.vault.modify(file, newContent);
		  new Notice('No entry found, File has been updated.');
		  return newDate.split(',')

		} else {
          new Notice('File not found.');
        }
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
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