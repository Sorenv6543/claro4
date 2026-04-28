// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { checkOwnerBundleSize } from '../check-bundle-size.js'

describe('checkOwnerBundleSize', () => {
  let tmpDir

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bundle-test-'))
  })

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  })

  it('passes when owner-app chunk is under the limit', () => {
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), Buffer.alloc(1024, 'a'))
    const result = checkOwnerBundleSize(tmpDir, 500)
    expect(result.passed).toBe(true)
    expect(result.totalKB).toBeLessThan(500)
  })

  it('fails when owner-app chunk exceeds the limit', () => {
    // Incompressible-ish content: random chars resist gzip
    const content = Buffer.from(
      Array.from({ length: 600 * 1024 }, () => Math.random().toString(36)[2]).join('')
    )
    fs.writeFileSync(path.join(tmpDir, 'owner-app-abc123.js'), content)
    const result = checkOwnerBundleSize(tmpDir, 1)
    expect(result.passed).toBe(false)
  })

  it('throws when no owner-app chunks are found', () => {
    fs.writeFileSync(path.join(tmpDir, 'vendor-abc123.js'), 'other chunk')
    expect(() => checkOwnerBundleSize(tmpDir)).toThrow('No owner-app chunks found')
  })

  it('throws when the assets directory does not exist', () => {
    expect(() => checkOwnerBundleSize('/tmp/__nonexistent_bundle_test_dir__')).toThrow()
  })
})
