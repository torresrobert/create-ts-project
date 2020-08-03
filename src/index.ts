#!/usr/bin/env node

import chalk from 'chalk';
import * as fs from 'fs';
import inquirer from 'inquirer';
import * as path from 'path';
import * as shell from 'shelljs';
import * as yargs from 'yargs';
import * as template from './utils/template';

const choices = fs.readdirSync(path.join(__dirname, 'templates'));

const questions = [
    {
        name: 'template',
        type: 'list',
        messages: 'What project template would you like to generate?',
        choices,
        when: (): any => !yargs.argv['template'],
    },
    {
        name: 'name',
        type: 'input',
        message: 'Process name:',
        when: (): any => !yargs.argv['name'],
        validate: (input: string): any => {
            if (/^([A-Za-z\-\_\d])+$/.test(input)) return true;
            else return 'Project name may only contain letters, numbers, underscores and hashes.';
        },
    },
];

const curr_dir = process.cwd();

export interface TemplateConfig {
    files?: string[];
    postMessage?: string;
}

export interface CliOptions {
    projectName: string;
    templateName: string;
    templatePath: string;
    targetPath: string;
    config: TemplateConfig;
}

function showMessage(options: CliOptions): void {
    console.log('');
    console.log(chalk.green('Done.'));
    console.log(chalk.green(`Go into the project: cd ${options.projectName}`));
    const message = options.config.postMessage;

    if (message) {
        console.log('');
        console.log(chalk.yellow(message));
        console.log('');
    }
}

function getTemplateConfig(templatePath: string): TemplateConfig {
    const configPath = path.join(templatePath, '.template.json');

    if (!fs.existsSync(configPath)) return {};

    const templateConfigContent = fs.readFileSync(configPath);

    if (templateConfigContent) {
        return JSON.parse(templateConfigContent.toString());
    }

    return {};
}

function createProject(projectPath: string): boolean {
    if (fs.existsSync(projectPath)) {
        console.log(chalk.red(`Folder ${projectPath} exists. Delete or use another name.`));
        return false;
    }
    fs.mkdirSync(projectPath);
    return true;
}

function isNode(options: CliOptions): boolean {
    return fs.existsSync(path.join(options.templatePath, 'package.json'));
}

function postProcessNode(options: CliOptions): boolean {
    shell.cd(options.targetPath);

    let cmd = '';

    if (shell.which('yarn')) {
        cmd = 'yarn';
    }
    if (shell.which('npm')) {
        cmd = 'npm';
    }

    if (cmd) {
        const result = shell.exec(cmd);
        if (result.code !== 0) {
            return false;
        }
    } else console.log(chalk.red('No yarn or npm found. Cannot run install.'));

    return true;
}

const SKIP_FILES = ['node_modules', '.template.json'];

function createDirectoryContents(templatePath: string, projectName: string, config: TemplateConfig): void {
    const filesToCreate = fs.readdirSync(templatePath);

    filesToCreate.forEach(file => {
        const origFilePath = path.join(templatePath, file);

        // get stats about the current file
        const stats = fs.statSync(origFilePath);

        if (SKIP_FILES.indexOf(file) > -1) return;

        if (stats.isFile()) {
            let contents = fs.readFileSync(origFilePath, 'utf8');

            contents = template.render(contents, { projectName });

            const writePath = path.join(curr_dir, projectName, file);
            fs.writeFileSync(writePath, contents, 'utf8');
        } else if (stats.isDirectory()) {
            fs.mkdirSync(path.join(curr_dir, projectName, file));

            // recursive call
            createDirectoryContents(path.join(templatePath, file), path.join(projectName, file), config);
        }
    });
}

function postProcess(options: CliOptions): boolean {
    if (isNode(options)) {
        return postProcessNode(options);
    }
    return true;
}

inquirer.prompt(questions).then((answers: any) => {
    answers = Object.assign({}, answers, yargs.argv);

    const projectChoice = answers['template'];
    const projectName = answers['name'];
    const templatePath = path.join(__dirname, 'templates', projectChoice);
    const targetPath = path.join(curr_dir, projectName);
    const templateConfig = getTemplateConfig(templatePath);

    const options: CliOptions = {
        projectName,
        templateName: projectChoice,
        templatePath,
        targetPath,
        config: templateConfig,
    };

    if (!createProject(targetPath)) {
        return;
    }
    createDirectoryContents(templatePath, projectName, templateConfig);

    if (!postProcess(options)) {
        return;
    }

    showMessage(options);
});
