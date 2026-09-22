#!/usr/bin/env python3
import json
import random
import re

CATEGORIES = [
    ("Phở & Nước Dùng Truyền Thống", "pho-broths", "Nước dùng ninh xương thảo mộc thơm lừng, bánh phở tươi dẻo dai", "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&w=800&q=80"),
    ("Món Kho Tộ Đậm Đà", "claypot-braised", "Thịt kho, cá kho niêu đất thơm nức mũi đậm đà hương vị quê hương", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"),
    ("Nem Rán & Món Khai Vị Giòn Tan", "appetizers-rolls", "Chả giò rế, nem nướng và các món ăn chơi giòn rụm bắt vị", "https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80"),
    ("Cơm Đĩa & Cơm Chiên Chảo Nóng", "rice-dishes", "Cơm tấm sườn bì chả, cơm chiên giòn hạt tơi ngập tràn topping", "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=80"),
    ("Gỏi Cuốn & Nộm Thanh Mát", "salads-fresh-rolls", "Rau thơm đồng nội cuốn bánh tráng tôm thịt chấm tương bơ đậu phộng", "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80"),
    ("Món Nướng Than Hoa & BBQ", "grilled-bbq", "Thịt xiên nướng, sườn que tẩm ướp sốt mật ong thơm lừng than hồng", "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"),
    ("Hải Sản Biển Tươi Sống", "seafood-specialties", "Tôm hùm, cua biển sốt me, mực nướng sa tế đậm vị mặn mòi của biển", "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=80"),
    ("Chay Thực Dưỡng & Thanh Đạm", "plant-based-vegan", "Món chay thanh tịnh từ nấm, rau củ hữu cơ và đậu hũ non tốt cho sức khỏe", "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80"),
    ("Mì Thủ Công & Mì Xào Giòn", "noodles-pastas", "Mì trứng sợi tươi, mì xào giòn hải sản và hủ tiếu Nam Vang trứ danh", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"),
    ("Bánh Mì & Điểm Tâm Sáng", "bakery-sandwiches", "Bánh mì Việt Nam vỏ giòn ruột xốp, pate thơm béo cùng dưa chua ngập tràn", "https://images.unsplash.com/photo-1626804475297-41608ea09aeb?auto=format&fit=crop&w=800&q=80"),
    ("Chè Cung Đình & Tráng Miệng", "sweet-soups-desserts", "Chè khúc bạch, chè bưởi An Giang, bánh flan caramel ngọt ngào thanh tao", "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80"),
    ("Trà Thảo Mộc & Thức Uống", "herbal-teas-brews", "Trà đào cam sả, cà phê muối, trà sen tuyết mát lạnh thanh lọc cơ thể", "https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80"),
    ("Lẩu & Món Nhúng Gia Đình", "hot-pot-dipping", "Nước lẩu chua cay Tom Yum, lẩu nấm bồ câu sum vầy ngày cuối tuần", "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80"),
    ("Ẩm Thực Đường Phố Sài Gòn & Hà Nội", "street-food-snacks", "Bánh tráng nướng, bắp xào bơ, phá lấu bò đặc sản đường phố", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"),
    ("Món Hấp Thanh Vị Dinh Dưỡng", "steamed-specialties", "Cá chẽm hấp Hong Kong, gà hấp lá chanh giữ trọn dưỡng chất tự nhiên", "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?auto=format&fit=crop&w=800&q=80"),
    ("Bánh Xèo & Bánh Khọt Giòn Rụm", "savory-pancakes", "Bánh xèo vàng ươm nghệ tây ngập nhân tôm thịt cuốn cải xanh", "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"),
    ("Trứng & Đậu Hũ Biến Tấu", "egg-tofu-delicacies", "Đậu hũ sốt cà chua, trứng cuộn ngũ sắc mềm mịn thơm béo", "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=800&q=80"),
    ("Ẩm Thực Cay Nồng Miền Trung", "spicy-central-heritage", "Bún bò Huế cay xé lưỡi, mì Quảng tôm thịt đậm đà hồn quê xứ Quảng", "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80"),
    ("Nước Chấm & Gia Vị Bí Truyền", "sauces-dips", "Muối ớt xanh Nha Trang, sốt mắm chua ngọt sệt kẹo tỏi ớt", "https://images.unsplash.com/photo-1472476443507-c7a5948772fc?auto=format&fit=crop&w=800&q=80"),
    ("Dim Sum & Há Cảo Á Đông", "dim-sum-dumplings", "Xíu mại tôm thịt, há cảo pha lê hấp xửng tre thơm phức ngào ngạt", "https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=800&q=80"),
    ("Mì Ý & Risotto Chuẩn Vị Ý", "italian-pasta-risotto", "Spaghetti Carbonara sốt trứng béo ngậy, Risotto hải sản thảo mộc", "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&q=80"),
    ("Ramen & Bento Nhật Bản", "japanese-ramen-donburi", "Tonkotsu Ramen xương hầm 18 giờ, trứng ngâm tương Ajitsuke Tamago", "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=80"),
    ("Cà Ri & Tom Yum Thái Lan", "thai-curries-tom-yum", "Canh chua Tom Yum tôm sú cốt dừa cay nồng, cà ri xanh thơm lá chanh kaffir", "https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=800&q=80"),
    ("Bò Bít Tết & Món Âu Hiện Đại", "modern-bistro-steaks", "Ribeye Steak sốt tiêu đen nấm truffle, khoai tây nghiền bơ mịn", "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"),
]

USERS = [
    {
        "id": "usr-admin-001",
        "email": "admin@culinaryblog.com",
        "userName": "culinary_admin",
        "displayName": "Executive Chef Admin",
        "avatarUrl": "https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=200&q=80",
        "bio": "Bếp trưởng điều hành với 18 năm kinh nghiệm nghệ thuật ẩm thực Đông Dương.",
        "isActive": True,
        "emailConfirmed": True,
        "roles": ["Admin", "Author"],
        "createdAt": "2026-01-01T08:00:00Z"
    },
    {
        "id": "usr-author-002",
        "email": "nguyen.chef@culinaryblog.com",
        "userName": "chef_nguyen",
        "displayName": "Chef Nguyễn Văn Minh",
        "avatarUrl": "https://images.unsplash.com/photo-1583394838336-acd977736f90?auto=format&fit=crop&w=200&q=80",
        "bio": "Nghệ nhân phở truyền thống và các món hầm niêu đất bí truyền xứ Kinh Kỳ.",
        "isActive": True,
        "emailConfirmed": True,
        "roles": ["Author"],
        "createdAt": "2026-01-15T10:30:00Z"
    },
    {
        "id": "usr-author-003",
        "email": "le.pastry@culinaryblog.com",
        "userName": "pastry_le",
        "displayName": "Lê Thục Đoan",
        "avatarUrl": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        "bio": "Chuyên gia bánh mì artisan và tráng miệng hiện đại phong cách Pháp - Á.",
        "isActive": True,
        "emailConfirmed": True,
        "roles": ["Author"],
        "createdAt": "2026-02-01T14:20:00Z"
    },
    {
        "id": "usr-author-004",
        "email": "tran.healthy@culinaryblog.com",
        "userName": "healthy_tran",
        "displayName": "Trần Mai Anh",
        "avatarUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
        "bio": "Chuyên gia dinh dưỡng lâm sàng, tác giả bộ thực đơn thực dưỡng lành mạnh.",
        "isActive": True,
        "emailConfirmed": True,
        "roles": ["Author"],
        "createdAt": "2026-02-10T09:15:00Z"
    },
    {
        "id": "usr-author-005",
        "email": "marco.rossi@culinaryblog.com",
        "userName": "bistro_marco",
        "displayName": "Marco Rossi",
        "avatarUrl": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        "bio": "Đầu bếp người Ý đam mê kết hợp ẩm thực Địa Trung Hải và gia vị nhiệt đới.",
        "isActive": True,
        "emailConfirmed": True,
        "roles": ["Author"],
        "createdAt": "2026-02-15T11:45:00Z"
    }
]

from generate_seed import RECIPE_TEMPLATES, INGREDIENT_POOL, STEP_TEMPLATES, slugify

def generate():
    categories_list = []
    category_counts = {i: 0 for i in range(len(CATEGORIES))}
    
    recipes_list = []
    
    # 100 recipes
    for idx in range(100):
        template_idx = idx % len(RECIPE_TEMPLATES)
        title, cat_index, desc = RECIPE_TEMPLATES[template_idx]
        if idx >= len(RECIPE_TEMPLATES):
            title = f"{title} (Phiên Bản Đặc Biệt {idx - len(RECIPE_TEMPLATES) + 2})"
            desc = f"{desc} Công thức gia truyền tinh chỉnh nâng tầm vị giác."
        
        category_counts[cat_index % len(CATEGORIES)] += 1
        
        slug = f"{slugify(title)}-{idx+1}"
        cat_id = f"cat-{(cat_index % len(CATEGORIES)) + 1:03d}"
        author = USERS[idx % len(USERS)]
        
        diff_val = random.choice([1, 2, 2, 3]) # RecipeDifficulty enum: 1=Easy, 2=Medium, 3=Hard
        status_val = 1 if idx < 95 else 0 # 1=Published, 0=Draft
        
        # At least 10 ingredients
        num_ingredients = random.randint(10, 13)
        chosen_ingredients = random.sample(INGREDIENT_POOL, num_ingredients)
        ingredients = []
        for ing_i, (ing_name, qty, unit, notes) in enumerate(chosen_ingredients):
            qty_val = round(float(qty) * random.uniform(0.9, 1.2), 1)
            ingredients.append({
                "id": f"ing-{idx+1:03d}-{ing_i+1:02d}",
                "recipeId": f"rec-{idx+1:03d}",
                "name": ing_name,
                "quantity": qty_val,
                "unit": unit,
                "notes": notes,
                "orderIndex": ing_i + 1
            })

        # At least 5 steps
        num_steps = random.randint(5, 7)
        steps = []
        for step_i in range(num_steps):
            s_title, s_desc, timer = STEP_TEMPLATES[step_i]
            steps.append({
                "id": f"step-{idx+1:03d}-{step_i+1:02d}",
                "recipeId": f"rec-{idx+1:03d}",
                "stepNumber": step_i + 1,
                "title": f"Bước {step_i+1}: {s_title}",
                "description": s_desc,
                "timerMinutes": timer
            })

        cat_img = CATEGORIES[cat_index % len(CATEGORIES)][3]
        images = [
            {
                "id": f"img-{idx+1:03d}-01",
                "recipeId": f"rec-{idx+1:03d}",
                "originalUrl": cat_img,
                "mediumUrl": cat_img,
                "thumbnailUrl": cat_img,
                "altText": title,
                "isPrimary": True,
                "orderIndex": 0
            }
        ]

        recipe = {
            "id": f"rec-{idx+1:03d}",
            "title": title,
            "slug": slug,
            "description": desc,
            "instructions": "Chi tiết công thức theo từng bước chuẩn hóa của bếp trưởng chuyên nghiệp.",
            "prepTime": random.choice([15, 20, 25, 30, 45]),
            "cookTime": random.choice([20, 30, 40, 45, 60, 90]),
            "servings": random.choice([2, 4, 4, 6, 8]),
            "difficulty": diff_val,
            "status": status_val,
            "categoryId": cat_id,
            "authorId": author["id"],
            "publishedAt": f"2026-02-{random.randint(1, 28):02d}T10:00:00Z",
            "viewCount": random.randint(120, 18500),
            "ratingAverage": round(random.uniform(4.4, 5.0), 2),
            "ratingCount": random.randint(15, 420),
            "notes": "Nên dùng nguyên liệu tươi hữu cơ vào buổi sáng sớm.",
            "isDeleted": False,
            "createdAt": "2026-02-01T08:00:00Z",
            "nutrition": {
                "calories": random.randint(280, 750),
                "protein": round(random.uniform(18.0, 52.0), 1),
                "carbohydrates": round(random.uniform(25.0, 85.0), 1),
                "fat": round(random.uniform(8.0, 36.0), 1),
                "fiber": round(random.uniform(2.0, 8.5), 1),
                "sodium": round(random.uniform(450.0, 1150.0), 1)
            },
            "ingredients": ingredients,
            "steps": steps,
            "images": images
        }
        recipes_list.append(recipe)

    for i, (name, slug, desc, img) in enumerate(CATEGORIES):
        categories_list.append({
            "id": f"cat-{i+1:03d}",
            "name": name,
            "slug": slug,
            "description": desc,
            "imageUrl": img,
            "orderIndex": i + 1,
            "recipeCount": category_counts[i],
            "createdAt": "2026-01-01T00:00:00Z",
            "isDeleted": False
        })

    # Render typescript file
    content = 'import { Category, Recipe, RecipeDifficulty, RecipeStatus, ApplicationUser } from "../types";\n\n'
    content += f'export const SEED_USERS: ApplicationUser[] = {json.dumps(USERS, indent=2, ensure_ascii=False)};\n\n'
    content += f'export const SEED_CATEGORIES: Category[] = {json.dumps(categories_list, indent=2, ensure_ascii=False)};\n\n'
    
    # We output recipes cleanly with enum references if needed, or numeric literals which are compatible with TS enum numbers
    content += f'export const SEED_RECIPES: Recipe[] = {json.dumps(recipes_list, indent=2, ensure_ascii=False)};\n'

    with open('src/data/seedData.ts', 'w', encoding='utf-8') as f:
        f.write(content)

    print("Wrote src/data/seedData.ts with:")
    print(f"Users: {len(USERS)}")
    print(f"Categories: {len(categories_list)}")
    print(f"Recipes: {len(recipes_list)}")

if __name__ == '__main__':
    generate()
