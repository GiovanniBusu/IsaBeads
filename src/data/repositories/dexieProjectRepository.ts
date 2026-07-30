import { db } from '../db'
import type { Project, ProjectBeadLine, RealizationNeedLine } from '../types'
import { nowIso } from '../../utils/format'
import { dexieInventoryRepository } from './dexieInventoryRepository'
import { dexieSettingsRepository } from './dexieSettingsRepository'
import type { ProjectRepository } from './types'

function scaledQuantity(line: ProjectBeadLine, project: Project, targetLengthCm: number): number {
  if (!project.lengthCm || project.lengthCm <= 0) return line.quantity
  const ratio = targetLengthCm / project.lengthCm
  return line.quantity * ratio
}

function lineToGrams(quantity: number, line: ProjectBeadLine, beadsPerGram: Record<string, number>): number {
  if (line.unit === 'grammes') return quantity
  const perGram = beadsPerGram[line.size] || 1
  return quantity / perGram
}

export const dexieProjectRepository: ProjectRepository = {
  async list() {
    const projects = await db.projects.toArray()
    return projects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  },

  async get(id) {
    return db.projects.get(id)
  },

  async create(project) {
    const timestamp = nowIso()
    return db.projects.add({ ...project, createdAt: timestamp, updatedAt: timestamp } as Project)
  },

  async update(id, patch) {
    await db.projects.update(id, { ...patch, updatedAt: nowIso() })
  },

  async remove(id) {
    await db.transaction('rw', db.projects, db.realizations, async () => {
      await db.realizations.where('projectId').equals(id).delete()
      await db.projects.delete(id)
    })
  },

  async listRealizations(projectId) {
    const realizations = await db.realizations.where('projectId').equals(projectId).toArray()
    return realizations.sort((a, b) => b.date.localeCompare(a.date))
  },

  async computeNeeds(project, lengthCm) {
    const settings = await dexieSettingsRepository.getAll()
    const lines: RealizationNeedLine[] = []
    for (const line of project.beadLines) {
      const quantity = scaledQuantity(line, project, lengthCm)
      const neededGrams = lineToGrams(quantity, line, settings.beadsPerGram)
      const inventoryItem = await dexieInventoryRepository.findByDbCodeAndSize(line.dbCode, line.size)
      const availableGrams = inventoryItem?.remainingGrams ?? 0
      lines.push({
        ...line,
        quantity,
        neededGrams,
        availableGrams,
        missingGrams: Math.max(0, neededGrams - availableGrams),
        inventoryItemId: inventoryItem?.id,
      })
    }
    return lines
  },

  async realize(project, lengthCm, note) {
    const needs = await this.computeNeeds(project, lengthCm)
    const realizationId = await db.realizations.add({
      projectId: project.id!,
      date: nowIso(),
      lengthCm,
      note,
    })
    for (const need of needs) {
      if (need.inventoryItemId) {
        await dexieInventoryRepository.deductStock(need.inventoryItemId, need.neededGrams, realizationId)
      }
    }
    return realizationId
  },
}
