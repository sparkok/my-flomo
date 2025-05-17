
'use server';

import prisma from '@/lib/prisma';
import type { Note } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { deriveTitleFromContent, extractTagsFromContent } from '@/lib/noteUtils';

export async function getNotesDB(): Promise<Note[]> {
  try {
    const dbNotes = await prisma.note.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return dbNotes.map(note => ({
      ...note,
      tags: JSON.parse(note.tagsJson), // Tags are stored as JSON string
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to fetch notes from DB:", error);
    return [];
  }
}

interface CreateNoteInput {
  content: string;
  imageDataUri?: string;
}

export async function createNoteDB(data: CreateNoteInput): Promise<Note | null> {
  const title = deriveTitleFromContent(data.content);
  const tags = extractTagsFromContent(data.content);

  try {
    const newDbNote = await prisma.note.create({
      data: {
        title,
        content: data.content,
        tagsJson: JSON.stringify(tags), // Store tags as JSON string
        imageDataUri: data.imageDataUri,
        // createdAt and updatedAt are handled by Prisma's default
      },
    });
    revalidatePath('/');
    return {
      ...newDbNote,
      tags: JSON.parse(newDbNote.tagsJson),
      createdAt: new Date(newDbNote.createdAt),
      updatedAt: new Date(newDbNote.updatedAt),
    };
  } catch (error) {
    console.error("Failed to create note in DB:", error);
    return null;
  }
}

interface UpdateNoteInput {
  content: string;
  imageDataUri?: string;
}

export async function updateNoteDB(id: string, data: UpdateNoteInput): Promise<Note | null> {
  const title = deriveTitleFromContent(data.content);
  const tags = extractTagsFromContent(data.content);

  try {
    const updatedDbNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content: data.content,
        tagsJson: JSON.stringify(tags), // Store tags as JSON string
        imageDataUri: data.imageDataUri,
        updatedAt: new Date(), // Explicitly set updatedAt
      },
    });
    revalidatePath('/');
    return {
      ...updatedDbNote,
      tags: JSON.parse(updatedDbNote.tagsJson),
      createdAt: new Date(updatedDbNote.createdAt),
      updatedAt: new Date(updatedDbNote.updatedAt),
    };
  } catch (error)
    {
    console.error(`Failed to update note ${id} in DB:`, error);
    return null;
  }
}

export async function deleteNoteDB(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.note.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error(`Failed to delete note ${id} from DB:`, error);
    return { success: false };
  }
}
