import { Link } from "react-router-dom";

export default function ProjectCard({ project, onDelete }) {
  const { id, name, page_count, total_crops } = project;

  return (
    <Link
      to={`/projects/${id}`}
      className="group block bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-zinc-700 transition-all hover:bg-zinc-900/80"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium text-zinc-100 truncate pr-2">
          {name}
        </h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
          className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-red-400 transition-all p-1 -mr-1 -mt-1"
          title="Delete project"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
            />
          </svg>
        </button>
      </div>

      <div className="flex items-center gap-4 text-xs text-zinc-500">
        <span>{page_count} pages</span>
        <span>{total_crops} crops</span>
      </div>
    </Link>
  );
}
