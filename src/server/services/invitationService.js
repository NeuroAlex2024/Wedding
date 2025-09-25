const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const { buildBaseSlug, sanitizeSlug } = require('../utils/slug');
const { renderInvitationHtml } = require('../templates/invitationTemplate');

const ROOT_DIR = path.join(__dirname, '..', '..');
const INVITES_DIR = path.join(ROOT_DIR, 'storage', 'invites');

class InvitationNotFoundError extends Error {
  constructor(slug) {
    super(`Invitation with slug "${slug}" was not found`);
    this.name = 'InvitationNotFoundError';
  }
}

async function ensureInvitesDirectory() {
  await fsp.mkdir(INVITES_DIR, { recursive: true });
}

async function ensureUniqueSlug(preferredSlug, allowCurrent) {
  const base = preferredSlug && preferredSlug.trim().length ? preferredSlug : 'invite';
  let candidate = base;
  let suffix = 2;
  while (true) {
    const directory = path.join(INVITES_DIR, candidate);
    try {
      await fsp.access(directory, fs.constants.F_OK);
      if (allowCurrent && candidate === allowCurrent) {
        return candidate;
      }
    } catch (error) {
      return candidate;
    }
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function getInvitationDirectory(slug) {
  return path.join(INVITES_DIR, slug);
}

function getInvitationFilePath(slug) {
  return path.join(getInvitationDirectory(slug), 'index.html');
}

async function saveInvitationFile(slug, html) {
  const directory = getInvitationDirectory(slug);
  await fsp.mkdir(directory, { recursive: true });
  const filePath = getInvitationFilePath(slug);
  await fsp.writeFile(filePath, html, 'utf8');
}

async function readInvitationHtml(slug) {
  const filePath = getInvitationFilePath(slug);
  try {
    const content = await fsp.readFile(filePath, 'utf8');
    return content;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new InvitationNotFoundError(slug);
    }
    throw error;
  }
}

async function deleteInvitation(slug) {
  const directory = getInvitationDirectory(slug);
  await fsp.rm(directory, { recursive: true, force: true });
}

function buildPublicUrl(slug, meta) {
  const protocol = meta?.protocol || 'http';
  const host = meta?.host || 'localhost';
  return `${protocol}://${host}/invite/${slug}`;
}

async function createInvitation(data, requestMeta) {
  await ensureInvitesDirectory();
  const baseSlug = buildBaseSlug(data.invitation);
  const preferredSlug = data.requestedSlug || baseSlug || 'invite';
  const allowCurrent = data.requestedSlug || null;
  const slug = await ensureUniqueSlug(preferredSlug, allowCurrent);
  const html = renderInvitationHtml({ invitation: data.invitation, theme: data.theme });
  await saveInvitationFile(slug, html);
  const url = buildPublicUrl(slug, requestMeta);
  return { slug, url };
}

async function updateInvitation(currentSlug, data, requestMeta) {
  const sanitizedCurrent = sanitizeSlug(currentSlug);
  if (!sanitizedCurrent) {
    throw new InvitationNotFoundError(currentSlug);
  }
  await ensureInvitesDirectory();
  const directory = getInvitationDirectory(sanitizedCurrent);
  try {
    await fsp.access(directory, fs.constants.F_OK);
  } catch (error) {
    throw new InvitationNotFoundError(sanitizedCurrent);
  }

  const baseSlug = buildBaseSlug(data.invitation);
  const preferredSlug = data.requestedSlug || sanitizedCurrent || baseSlug || 'invite';
  const targetSlug = await ensureUniqueSlug(preferredSlug, sanitizedCurrent);
  const html = renderInvitationHtml({ invitation: data.invitation, theme: data.theme });

  if (targetSlug !== sanitizedCurrent) {
    const targetDirectory = getInvitationDirectory(targetSlug);
    await fsp.mkdir(targetDirectory, { recursive: true });
    const targetFilePath = getInvitationFilePath(targetSlug);
    await fsp.writeFile(targetFilePath, html, 'utf8');
    await fsp.rm(directory, { recursive: true, force: true });
  } else {
    await saveInvitationFile(targetSlug, html);
  }

  const url = buildPublicUrl(targetSlug, requestMeta);
  return { slug: targetSlug, url };
}

module.exports = {
  InvitationNotFoundError,
  INVITES_DIR,
  ensureInvitesDirectory,
  ensureUniqueSlug,
  getInvitationDirectory,
  getInvitationFilePath,
  saveInvitationFile,
  readInvitationHtml,
  deleteInvitation,
  createInvitation,
  updateInvitation,
  buildPublicUrl
};
