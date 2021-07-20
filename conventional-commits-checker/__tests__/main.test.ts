import { checkCommitMessage } from '../src/commit'
import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import { expect, test } from '@jest/globals'
import fs from 'fs'

test('validate feat commit message', () => {
  const input = 'feat: My cool new feature'
  const result = checkCommitMessage(input)
  expect(result).toBe(true)
})

test('validate patch commit message', () => {
  const input = 'patch: My cool new feature'
  const result = checkCommitMessage(input)
  expect(result).toBe(true)
})

test('validate breaking change commit message', () => {
  const input =
    'feat: My cool new feature\nLet me tell you something\n\nBREAKING CHANGE: Sorry for that breaking change.\n'
  const result = checkCommitMessage(input)
  expect(result).toBe(true)
})

test('validate incorrect commit message', () => {
  const input = 'My cool new feature'
  const result = checkCommitMessage(input)
  expect(result).toBe(false)
})

test('validate undefined commit message', () => {
  const input = undefined
  const result = checkCommitMessage(input)
  expect(result).toBe(false)
})

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs push event', () => {
  process.env['GITHUB_EVENT_PATH'] = path.join(__dirname, 'push_event.json')
  process.env['GITHUB_EVENT_NAME'] = 'push'
  process.env['INPUT_FAIL-ON-ERROR'] = 'false'
  process.env['INPUT_COMPLIANCE-RULE'] = 'at-least-once'
  process.env['INPUT_ACCESS-TOKEN'] = '123abc'

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
