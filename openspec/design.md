# Kiáº¿n trÃºc Tá»•ng quan (Baseline Architecture)

## 1. CÃ´ng nghá»‡
- **Frontend**: HTML5, Vanilla JavaScript, CSS3 (Flexbox/Grid). KhÃ´ng sá»­ dá»¥ng Framework Frontend (React/Vue/Angular).
- **Backend/Database**: Supabase (PostgreSQL, Realtime, Storage).
- **Offline Fallback**: Sá»­ dá»¥ng LocalStorage Ä‘á»ƒ lÆ°u trá»¯ táº¡m thá»i náº¿u khÃ´ng cÃ³ káº¿t ná»‘i Supabase.

## 2. Giao diá»‡n (UI/UX)
- Thiáº¿t káº¿ theo phong cÃ¡ch Game phiÃªu lÆ°u viá»…n tÆ°á»Ÿng (Sci-fi, Há»c viá»‡n ngÃ¢n hÃ ).
- CÃ¡c tráº¡m tÆ°Æ¡ng tÃ¡c (Map Items) Ä‘Ã³ng vai trÃ² lÃ  cÃ¡c mÃ n chÆ¡i / khu vá»±c tÃ­nh nÄƒng.
- Giao diá»‡n Single Page Application (SPA), áº©n hiá»‡n cÃ¡c #id-screen thÃ´ng qua DOM Manipulation.

## 3. CÃ¡c thá»±c thá»ƒ chÃ­nh (Entities)
- **Há»c sinh (Users)**: Role student. CÃ³ tÃ i khoáº£n, Ä‘iá»ƒm sá»‘ (score), káº¹o (lollipops), lá»‹ch sá»­ lÃ m bÃ i.
- **Admin**: Role dmin. CÃ³ quyá»n truy cáº­p Tráº¡m CÃ i Ä‘áº·t, phÃª duyá»‡t tÃ i khoáº£n, táº¡o Ä‘á».
- **CÃ¢u há»i (Questions)**: PhÃ¢n theo mÃ´n (ToÃ¡n, Tiáº¿ng Viá»‡t), khá»‘i lá»›p (1-5), Ä‘á»™ khÃ³.
- **ThÃº cÆ°ng (Pets)**: 11 loáº¡i thÃº cÆ°ng há»— trá»£ ká»¹ nÄƒng Ä‘áº·c biá»‡t trong quÃ¡ trÃ¬nh lÃ m bÃ i.

## 4. Quáº£n lÃ½ Tráº¡ng thÃ¡i (State Management)
- ToÃ n bá»™ state Ä‘Æ°á»£c quáº£n lÃ½ trong object toÃ n cá»¥c window.app.
- Gá»“m cÃ¡c submodule: pp.data, pp.ui, pp.router, pp.game, pp.exam, pp.shop, pp.treasure, pp.quest.
