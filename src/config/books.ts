export interface Book {
  id: string;
  title: string;
  filename: string;
  path: string;
  description: string;
  coverColor: string;
  author: string;
  pages?: number;
}

export const booksList: Book[] = [
  {
    id: 'sys-analyst-2nd',
    title: '系统分析师教程（第2版）',
    filename: 'sys-analyst-2nd.pdf',
    path: 'https://pdf.xiaowanstudio.cn/sys-analyst-2nd.pdf',
    description: '全国计算机技术与软件专业技术资格（水平）考试指定用书，系统分析师考试的核心教材。',
    coverColor: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
    author: '全国计算机专业技术资格考试办公室',
    pages: 777 // Pre-filled from our diagnostic test
  }
];
