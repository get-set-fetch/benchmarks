# scrape 1 mil urls within a single project with a single scraper instance
# urls are gradually discovered using PerfNodeFetchPlugin
# simulating scraping results pages with 50 new urls per result page
# module "benchmark_1000k_1project_1scraper_new_urls" {
#   source = "../../node_modules/@get-set-fetch/scraper/cloud/terraform"

#   region                 = "fra1"
#   public_key_name        = "get-set-fetch"
#   public_key_file        = var.public_key_file
#   private_key_file       = var.private_key_file
#   ansible_inventory_file = "../ansible/inventory/hosts.cfg"

#   pg = {
#     name                  = "pg"
#     image                 = "ubuntu-20-04-x64"
#     size                  = "s-4vcpu-8gb"
#     ansible_playbook_file = "../ansible/pg-setup.yml"
#   }

#   scraper = {
#     count                 = 1
#     name                  = "scraper"
#     image                 = "ubuntu-20-04-x64"
#     size                  = "s-1vcpu-1gb"
#     ansible_playbook_file = "../ansible/scraper-setup-new-urls.yml"
#   }
# }

# scrape 1 mil urls within a single project with multiple scraper instance
# urls are saved in queue when scraping starts from an external csv file
module "benchmark_1000k_1project_multiple_scrapers_csv_urls" {
  source = "../../node_modules/@get-set-fetch/scraper/cloud/terraform"

  region                 = "fra1"
  public_key_name        = "get-set-fetch"
  public_key_file        = var.public_key_file
  private_key_file       = var.private_key_file
  ansible_inventory_file = "../ansible/inventory/hosts.cfg"

  pg = {
    name                  = "pg"
    image                 = "ubuntu-20-04-x64"
    size                  = "s-4vcpu-8gb"
    ansible_playbook_file = "../ansible/pg-setup.yml"
  }

  scraper = {
    count                 = 1
    name                  = "scraper"
    image                 = "ubuntu-20-04-x64"
    size                  = "s-1vcpu-1gb"
    ansible_playbook_file = "../ansible/scraper-setup-saved-urls.yml"
  }
}



