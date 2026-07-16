export type SlotListItem = {
  id: string;
  experienceId: string;
  date: string;
  startTime: string;
  capacity: number;
};

export interface SlotRepository {
  findAvailableByExperience(experienceId: string): Promise<SlotListItem[]>;
}
