import Link from "next/link";
interface BreadcrumbProps {
  pageName: string;
  parentName: string;
}
const Breadcrumb = ({ pageName, parentName = "" }: BreadcrumbProps) => {
  const hasParent = Boolean(parentName);
  return (
    <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between">
      <h2 className="text-lg font-semibold text-black sm:text-xl dark:text-white">
        {pageName}
      </h2>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-gray-500">
          <li>
            <Link className="rounded-md px-2 py-1 transition-colors hover:text-primary" href="/">
              Dashboard
            </Link>
          </li>
          {hasParent && (
            <>
              <li className="text-gray-300">/</li>
              <li className="rounded-md bg-gray-50 px-2 py-1 text-gray-600">
                {parentName}
              </li>
            </>
          )}
          <li className="text-gray-300">/</li>
          <li className="rounded-md bg-primary/10 px-2 py-1 font-semibold text-primary">
            {pageName}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
