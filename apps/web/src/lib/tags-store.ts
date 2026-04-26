/**
 * Tags — global tag metadata and entity→tag links. Stored in localStorage.
 */

import { lsRead, lsWrite, rid } from "@/lib/local-storage";

export type TagEntityType = "customer" | "product" | "all";

export interface Tag {
  id: string;
  name: string;
  color: string; // hex
  entity_type: TagEntityType;
  created_at: string;
}

export interface EntityTagsMap {
  [entityId: string]: string[]; // tag_ids
}

const TAGS_KEY = "tj_tags_v1";
const LINKS_KEY = "tj_entity_tags_v1";

export function readTags(): Tag[] {
  return lsRead<Tag[]>(TAGS_KEY, []);
}

export function writeTags(tags: Tag[]): void {
  lsWrite(TAGS_KEY, tags);
}

export function readLinks(): EntityTagsMap {
  return lsRead<EntityTagsMap>(LINKS_KEY, {});
}

export function writeLinks(map: EntityTagsMap): void {
  lsWrite(LINKS_KEY, map);
}

export function makeTag(input: Omit<Tag, "id" | "created_at">): Tag {
  return {
    ...input,
    id: rid("tag"),
    created_at: new Date().toISOString(),
  };
}

export function usageCount(tagId: string, links: EntityTagsMap): number {
  let count = 0;
  for (const ids of Object.values(links)) {
    if (ids.includes(tagId)) count++;
  }
  return count;
}

export const DEFAULT_TAG_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316",
];
