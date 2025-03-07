//Requires
const fs = require('fs');
const crypto  = require('crypto');
const Polyglot = require('node-polyglot');
const { dir, log, logOk, logWarn, logError, cleanTerminal } = require('../extras/console');
const context = 'Translator';


/**
 * Small translation module built around Polyglot.js.
 * For the future, its probably a good idea to upgrade to i18next
 */
module.exports = class Translator {
    constructor() {
        logOk('::Started', context);
        this.language = globals.config.language;
        this.polyglot = null;

        //Load language
        try {
            let phrases = this.getLanguagePhrases(this.language);
            let polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key)=>{
                    logError(`Missing key '${key}' from translation file.`, 'Translator')
                    return key;
                },
                phrases
            }
            this.polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            logError(error.message, context);
            process.exit();
        }
    }


    //================================================================
    /**
     * Refresh translator configurations
     * @param {string} phrases
     */
    refreshConfig(phrases){
        //Load language
        try {
            let polyglotOptions = {
                allowMissing: false,
                onMissingKey: (key)=>{
                    logError(`Missing key '${key}' from translation file.`, 'Translator')
                    return key;
                },
                phrases
            }
            this.polyglot = new Polyglot(polyglotOptions);
        } catch (error) {
            logError(error.message, context);
            process.exit();
        }

        //Rebuild Monitor's schedule with new text
        try {
            globals.monitor.buildSchedule();
        } catch (error) {}
    }


    //================================================================
    /**
     * Loads a language file or throws Error.
     * @param {string} lang
     */
    getLanguagePhrases(lang){
        let raw;
        let jsonData;

        const thrower = (msg) => {
            throw new Error(`Unable to load 'locale/${lang}.json'. (${msg})`);
        }

        try {
            raw = fs.readFileSync(`locale/${lang}.json`, 'utf8');
        } catch (error) {
            thrower('cannot read file');
        }

        //NOTE: this "protection" is to incentivize users to modify the git-untracked `locale/custom.json` file.
        // since modifying any other file will result in the user not being able to update txAdmin just by typing `git pull`.
        let langHashes = {
            en: '1b514b088a5ee7015b0f0d0ae0319b7b2a6aff0d', //english
            zh: '11857d2ba76952c488c3920d646f1e2ebd9d3537', //chinese
            cs: 'b7e867715b628815e23d9dc0761e90301eb74d41', //czech
            da: '98a2dad93e3cf19ab52f5b0aa17a9ea1c3c1cbcd', //danish
            nl: 'ec074d2281f059b1280984776c0fe57cf480d0d4', //dutch
            fr: 'e39fec39485e3208f4d1d0bf341839f81159d432', //french
            de: 'c6754b76429df76dc9000912d72b77f385417f83', //german
            hu: 'c28b5a084cbcad7be0a60c87c8f5b24b999752e2', //hungarian
            pt_BR: 'a55fd4cf965097108502860204f5f5abc2ed6e7f', //portuguese
            ro: '77c2a2b46af30859cdc8113df8917a607dbe7f35', //romanian
            es: '73db20da35fc2b38f931dff57b2a9e8d47435b1a', //spanish
        }
        let hash = null;
        try {
            //FIXME: quickfix for git changing the line endings
            let toHash = JSON.stringify(JSON.parse(raw));
            hash = crypto.createHash('SHA1').update(toHash).digest("hex");
            if(globals.config.verbose) logOk(`Hash for ${lang} is ${hash}`, context);
        } catch (error) {
            if(globals.config.verbose) logError(error);
        }
        if(langHashes.hasOwnProperty(lang) && hash !== null && hash !== langHashes[lang]){
            thrower('Please do not modify this file. Revert the changes and use the Custom language setting.')
        }

        try {
            jsonData = JSON.parse(raw);
        } catch (error) {
            thrower('JSON parse error');
        }

        if(jsonData.constructor !== Object){
            thrower('JSON parse error - not an object');
        }

        return jsonData;
    }


    //================================================================
    /**
     * Perform a translation (polyglot.t)
     * @param {string} key
     * @param {object} options
     */
    t(key, options){
        if(typeof options === 'undefined') options = {};
        try {
            return this.polyglot.t(key, options);
        } catch (error) {
            logError(`Error performing a translation with key '${key}'`, context);
            return key;
        }
    }

} //Fim Translator()
