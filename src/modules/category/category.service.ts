import { Injectable } from "@nestjs/common";
import { Category } from "@prisma/client";
import { LoggingService } from "src/shared/logging/logging.service";
import { PrismaService } from "src/shared/prisma/prisma.service";

@Injectable()
export class CategoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggingService
  ) {}

  getCategoryTree(categories: Category[]): Category[] {
    const categoryMap: { [key: string]: any } = {};
    const tree: Category[] = [];
    
    categories.forEach((item: any) => {
      categoryMap[item.id] = { ...item, children: [] };
    });
    
    categories.forEach((item: any) => {
      const category = categoryMap[item.id];
      
      if (item.parentId === null || item.parentId === undefined) {
        tree.push(category);
      } else if (categoryMap[item.parentId]) {
        categoryMap[item.parentId].children.push(category);
      } else {
        tree.push(category);
      }
    });
    
    return tree;
  }

  async checkExistedCategoryById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: {
        id,
        deletedAt: null
      }
    });
    return !!category;
  }
}