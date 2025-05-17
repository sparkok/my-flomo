'use server';

import prisma from '@/lib/prisma';
import type { Note } from '@/lib/types';
import { revalidatePath } from 'next/cache';

// Helper function to derive title from content
const deriveTitleFromContent = (content: string): string => {
  if (!content) return "";
  const lines = content.split('\n');
  for (const line of lines) {
    let processedLine = line;
    // Remove [[note:ID]] links
    processedLine = processedLine.replace(/\[\[note:[^\]]+\]\]/g, '');
    // Remove #tags
    processedLine = processedLine.replace(/#([^#\s\/]+(?:\/[^#\s\/]+)*)/g, '');
    processedLine = processedLine.trim();
    if (processedLine.length > 0) {
      return processedLine;
    }
  }
  return ""; // Return empty if no suitable line found
};

// Helper function to extract tags from content
const extractTagsFromContent = (content: string): string[] => {
  const extracted: string[] = [];
  const regex = /#([^#\s\/]+(?:\/[^#\s\/]+)*)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    extracted.push(match[1]);
  }
  return Array.from(new Set(extracted)).sort();
};


export async function getNotes(): Promise<Note[]> {
  try {
    const dbNotes = await prisma.note.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    return dbNotes.map(note => ({
      ...note,
      tags: JSON.parse(note.tagsJson),
      // Ensure Date objects, Prisma might return strings depending on context/driver
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    }));
  } catch (error) {
    console.error("Failed to fetch notes:", error);
    // Consider more robust error handling or re-throwing for client to handle
    return [];
  }
}

interface CreateNoteInput {
  content: string;
  imageDataUri?: string;
}

export async function createNote(data: CreateNoteInput): Promise<Note | null> {
  const title = deriveTitleFromContent(data.content);
  const tags = extractTagsFromContent(data.content);

  try {
    const newDbNote = await prisma.note.create({
      data: {
        title,
        content: data.content,
        tagsJson: JSON.stringify(tags),
        imageDataUri: data.imageDataUri,
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
    console.error("Failed to create note:", error);
    return null;
  }
}

interface UpdateNoteInput {
  content: string;
  imageDataUri?: string;
}

export async function updateNote(id: string, data: UpdateNoteInput): Promise<Note | null> {
  const title = deriveTitleFromContent(data.content);
  const tags = extractTagsFromContent(data.content);

  try {
    const updatedDbNote = await prisma.note.update({
      where: { id },
      data: {
        title,
        content: data.content,
        tagsJson: JSON.stringify(tags),
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
  } catch (error) {
    console.error("Failed to update note:", error);
    return null;
  }
}

export async function deleteNote(id: string): Promise<{ success: boolean }> {
  try {
    await prisma.note.delete({
      where: { id },
    });
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Failed to delete note:", error);
    return { success: false };
  }
}
