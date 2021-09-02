import { clickOn, fillField, expectMatchElement } from '../expectPuppeteer'
import {
  autoAnswerDialog,
  clickOnTreeNode,
  CONFIRM_DIALOG,
  expectBotApiCallSuccess,
  gotoStudio,
  triggerKeyboardShortcut,
  waitForBotApiResponse
} from '../utils'

const waitForFilesToLoad = async () =>
  page.waitForFunction('document.querySelectorAll(".bp3-icon-document").length > 0')

describe('Module - Code Editor', () => {
  beforeAll(async () => {
    if (!page.url().includes('studio')) {
      await gotoStudio()
    }
  })

  it('Load Code Editor', async () => {
    await clickOn('#bp-menu_code-editor')
    await expectBotApiCallSuccess('mod/code-editor/files')
  })

  it('Create new action', async () => {
    await clickOn('#btn-add-action')
    await fillField('#input-name', 'hello')
    await clickOn('#btn-submit')

    await page.focus('#monaco-editor')
    await page.mouse.click(469, 297)
    await page.waitFor(500) // Required so the editor is correctly focused at the right place
    await page.keyboard.type("const lol = 'hi' //")

    await Promise.all([
      expectBotApiCallSuccess('mod/code-editor/save', 'POST'),
      expectBotApiCallSuccess('mod/code-editor/files', 'GET'),
      triggerKeyboardShortcut('KeyS', true)
    ])
  })

  it('Duplicate action', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('hello.js', 'right')
    await clickOn('#btn-duplicate')

    await expectBotApiCallSuccess('mod/code-editor/save', 'POST')
  })

  it('Multiple cut & paste', async () => {
    await waitForFilesToLoad()
    await clickOn('#btn-cut-multiple')
    // await page.waitFor(500) // Required so the editor is enable multiple cut
    await clickOnTreeNode('hello.js')
    // await page.waitFor(500) // Required so the editor is correctly focused at the file (as we don't open it)

    await clickOnTreeNode('assets', 'right')
    await clickOn('#btn-paste')

    await expectBotApiCallSuccess('mod/code-editor/save', 'POST')

    await Promise.all([
      expectBotApiCallSuccess('mod/code-editor/save', 'POST'),
      expectBotApiCallSuccess('mod/code-editor/files', 'GET'),
    ])
  })

  it('Disable file', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('hello_copy.js', 'right')
    await clickOn('#btn-disable')

    await expectBotApiCallSuccess('mod/code-editor/rename', 'POST')
    const response = await waitForBotApiResponse('mod/code-editor/files')
    const disabledFile = response['bot.actions'].find(x => x.name === '.hello_copy.js')
    expect(disabledFile).toBeDefined()
  })

  it('Delete file', async () => {
    await waitForFilesToLoad()
    await clickOnTreeNode('.hello_copy.js', 'right')
    await clickOn('#btn-delete')
    await clickOn(CONFIRM_DIALOG.ACCEPT)

    await expectBotApiCallSuccess('mod/code-editor/remove', 'POST')
    const response = await waitForBotApiResponse('mod/code-editor/files')
    expect(response['bot.actions'].find(x => x.name === '.hello_copy.js')).toBeUndefined()
  })

  it('Open two tabs', async () => {
    await waitForFilesToLoad()

    await clickOnTreeNode('builtin.json', 'left')
    await expectBotApiCallSuccess('mod/code-editor/readFile', 'POST')
    await expectMatchElement('div[id="builtin.json"]', { text: 'builtin.json' })

    await clickOnTreeNode('channel-web.json', 'left')
    await expectBotApiCallSuccess('mod/code-editor/readFile', 'POST')
    await expectMatchElement('div[id="channel-web.json"]', { text: 'channel-web.json' })
  })
})
