/**
 * @name ReactionNotifications
 * @invite undefined
 * @authorLink undefined
 * @donate undefined
 * @patreon undefined
 * @website https://github.com/DaBLEshOT/ReactionNotifications
 * @source 
 */
/*@cc_on
@if (@_jscript)
	
	// Offer to self-install for clueless users that try to run this directly.
	var shell = WScript.CreateObject("WScript.Shell");
	var fs = new ActiveXObject("Scripting.FileSystemObject");
	var pathPlugins = shell.ExpandEnvironmentStrings("%APPDATA%\BetterDiscord\plugins");
	var pathSelf = WScript.ScriptFullName;
	// Put the user at ease by addressing them in the first person
	shell.Popup("It looks like you've mistakenly tried to run me directly. \n(Don't do that!)", 0, "I'm a plugin for BetterDiscord", 0x30);
	if (fs.GetParentFolderName(pathSelf) === fs.GetAbsolutePathName(pathPlugins)) {
		shell.Popup("I'm in the correct folder already.", 0, "I'm already installed", 0x40);
	} else if (!fs.FolderExists(pathPlugins)) {
		shell.Popup("I can't find the BetterDiscord plugins folder.\nAre you sure it's even installed?", 0, "Can't install myself", 0x10);
	} else if (shell.Popup("Should I copy myself to BetterDiscord's plugins folder for you?", 0, "Do you need some help?", 0x34) === 6) {
		fs.CopyFile(pathSelf, fs.BuildPath(pathPlugins, fs.GetFileName(pathSelf)), true);
		// Show the user where to put plugins in the future
		shell.Exec("explorer " + pathPlugins);
		shell.Popup("I'm installed!", 0, "Successfully installed", 0x40);
	}
	WScript.Quit();

@else@*/

module.exports = (() => {
    const config = {"info":{"name":"ReactionNotifications","authors":[{"name":"DaBLEshOT","discord_id":"145880086157983744","github_username":"DaBLEshOT"}],"version":"0.0.1","description":"Add notifications for reactions","github":"https://github.com/DaBLEshOT/ReactionNotifications","github_raw":""},"changelog":[{"title":"First release","items":["Initial build"]}],"main":"index.js"};

    return !global.ZeresPluginLibrary ? class {
        constructor() {this._config = config;}
        getName() {return config.info.name;}
        getAuthor() {return config.info.authors.map(a => a.name).join(", ");}
        getDescription() {return config.info.description;}
        getVersion() {return config.info.version;}
        load() {
            BdApi.showConfirmationModal("Library Missing", `The library plugin needed for ${config.info.name} is missing. Please click Download Now to install it.`, {
                confirmText: "Download Now",
                cancelText: "Cancel",
                onConfirm: () => {
                    require("request").get("https://rauenzi.github.io/BDPluginLibrary/release/0PluginLibrary.plugin.js", async (error, response, body) => {
                        if (error) return require("electron").shell.openExternal("https://betterdiscord.net/ghdl?url=https://raw.githubusercontent.com/rauenzi/BDPluginLibrary/master/release/0PluginLibrary.plugin.js");
                        await new Promise(r => require("fs").writeFile(require("path").join(BdApi.Plugins.folder, "0PluginLibrary.plugin.js"), body, r));
                    });
                }
            });
        }
        start() {}
        stop() {}
    } : (([Plugin, Api]) => {
        const plugin = (Plugin, Library) => {

    const { Logger, Patcher, WebpackModules, Toasts, DiscordAPI } = Library;

    return class ReactionNotifications extends Plugin {
        constructor() {
            super();

            this.users = [];
            this.currentUser = null
            this.sound = null;

            this.cancelPatch = null;

            this.transitionTo = WebpackModules.getByProps('transitionTo').transitionTo
        }

        onStart() {
            this.users = DiscordAPI.users;
            this.currentUser = DiscordAPI.currentUser;

            const notification = new Notification(`server channel (1 unread)`, { body: `neki`, silent: true });
            let electron = WebpackModules.getByProps("setBadge");
            //electron.setBadge(0);

            //this.goToMessage("", "271708549569183746", "801187369641967646");
            
            //Patcher.after(WebpackModules.getByProps("dispatch"), "dispatch", this.dispatch);
            this.sound = WebpackModules.getByProps("playSound");
            this.cancelPatch = BdApi.monkeyPatch(WebpackModules.getByProps("dispatch"), "dispatch", { after: this.dispatch.bind(this) });
        }

        dispatch(data) {
            if (data.methodArguments[0].type == "MESSAGE_REACTION_ADD") {
                Logger.log(data);
                const messageUserId = data.methodArguments[0].userId;
                const emoji = data.methodArguments[0].emoji;
                
                if (messageUserId == this.currentUser.discordObject.id) {
                    const reactionUser = this.users.find(user => user.discordObject.id == messageUserId);
                    this.sound.playSound("message1", 0.4);
                    Logger.log(data);

                    const notification = new Notification(`Reaction`, { body: `${reactionUser.discordObject.username} reacted with ${emoji.name}`, silent: true });
                    notification.addEventListener("click", () => { this.goToMessage("", data.methodArguments[0].channelId, data.methodArguments[0].messageId) });
                    
                    //Toasts.default(`<b>${reactionUser?.discordObject.username || ""}</b> reacted with ${emoji.name}`, {timeout: 5000});
                }
            }
        }

        goToMessage(server, channel, message) {
            require('plugins/ReactionNotifications/electron').remote.getCurrentWindow().focus();
            this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`);
            requestAnimationFrame(() => this.transitionTo(`/channels/${server ? server : '@me'}/${channel}/${message}`));
        }

        onStop() {
            this.cancelPatch();
            //Patcher.unpatchAll();
        }
    };

};
        return plugin(Plugin, Api);
    })(global.ZeresPluginLibrary.buildPlugin(config));
})();
/*@end@*/